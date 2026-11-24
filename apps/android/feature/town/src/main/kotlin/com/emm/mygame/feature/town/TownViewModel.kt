package com.emm.mygame.feature.town

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownFoundResult
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkResult
import com.emm.mygame.core.model.town.registeredBetween
import com.emm.mygame.core.projection.repaintDelay
import com.emm.mygame.feature.town.guidance.GuidanceRequests
import com.emm.mygame.feature.town.hiring.HiringRequests
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelChildren
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

private val failedReadRetry: Duration = 1.minutes

class TownViewModel(
    private val towns: TownRepository,
    private val sessions: SessionRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<TownUiState> = MutableStateFlow(TownUiState.Loading)

    val state: StateFlow<TownUiState> = _state.asStateFlow()

    private val _effects: Channel<TownEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<TownEffect> = _effects.receiveAsFlow()

    private var projection: Job? = null

    private var shown: TownSnapshot? = null

    private var requests: TownRequests = TownRequests.none

    private var registered: TownRegistered = TownRegistered.nothing

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = true

    private val hiring: HiringRequests = HiringRequests(
        towns = towns,
        scope = viewModelScope,
        requests = { requests },
        onDrawn = ::drawRequests,
        onAnswered = ::restartFrom,
    )

    private val guidance: GuidanceRequests = GuidanceRequests(
        towns = towns,
        scope = viewModelScope,
        onClosed = { drawRequests(requests) },
    )

    init {
        open()
    }

    fun onIntent(intent: TownIntent) {
        if (_state.value is TownUiState.SigningOut) return
        when (intent) {
            TownIntent.ScreenShown -> show()
            TownIntent.ScreenHidden -> {
                isShown = false
                projection?.cancel()
            }
            TownIntent.RetryTapped -> if (_state.value == TownUiState.Failed) open()
            TownIntent.GoToTownTapped -> open()
            is TownIntent.NameChanged -> rename(intent.name)
            TownIntent.NameSubmitted -> found()
            is TownIntent.BuildTapped -> start(intent.building)
            is TownIntent.StopTapped -> stop(TownUiState.WorkTarget(intent.building, intent.level))
            is TownIntent.HiringEntryChanged -> hiring.enter(intent.hire, intent.entry)
            is TownIntent.StartHiringTapped -> if (shown != null) hiring.place(intent.hire)
            is TownIntent.StopHiringTapped -> if (shown != null) hiring.stop(intent.target)
            is TownIntent.TipClosed -> if (shown != null) guidance.closeTip(intent.tip)
            TownIntent.GoalClosed -> if (shown != null) guidance.closeGoal()
            TownIntent.SignOutTapped -> signOut()
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        when (_state.value) {
            TownUiState.Loading -> open()
            is TownUiState.Content -> reread()
            else -> Unit
        }
    }

    private fun open() {
        projection?.cancel()
        shown = null
        val held: HeldTown? = towns.town.value
        if (held != null) return openHeld(held)
        _state.value = TownUiState.Loading
        projection = viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> project(measured(answer.town))
                TownReadResult.NoTown -> askName()
                TownReadResult.Unreachable -> _state.value = TownUiState.Failed
            }
        }
    }

    private fun openHeld(held: HeldTown) {
        gap = held.gap
        draw(held.town)
        reread()
    }

    private fun reread() {
        val last: TownSnapshot = shown ?: return
        projection = viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> {
                    requests = requests.keptAfterRead()
                    project(measured(answer.town))
                }
                TownReadResult.NoTown -> askName()
                TownReadResult.Unreachable -> project(last, firstReadAt = serverNow() + failedReadRetry)
            }
        }
    }

    private fun askName() {
        shown = null
        _state.value = TownUiState.Naming(name = "", status = TownUiState.NamingStatus.Idle)
    }

    private fun rename(name: String) {
        _state.update { current: TownUiState ->
            if (current is TownUiState.Naming) current.copy(name = name) else current
        }
    }

    private fun found() {
        val naming: TownUiState.Naming = _state.value as? TownUiState.Naming ?: return
        if (naming.status == TownUiState.NamingStatus.Submitting) return
        answerNaming(TownUiState.NamingStatus.Submitting)
        viewModelScope.launch {
            when (val answer: TownFoundResult = towns.found(naming.name)) {
                is TownFoundResult.Founded -> restartFrom(measured(answer.town), TownRequests.none)
                is TownFoundResult.Refused -> answerNaming(TownUiState.NamingStatus.Refused(answer.refusal))
                TownFoundResult.Unreachable -> answerNaming(TownUiState.NamingStatus.Unreachable)
            }
        }
    }

    private fun answerNaming(status: TownUiState.NamingStatus) {
        _state.update { current: TownUiState ->
            if (current is TownUiState.Naming) current.copy(status = status) else current
        }
    }

    private fun start(building: TownBuildingKind) {
        if (shown == null || requests.start is TownUiState.StartStatus.Waiting) return
        drawRequests(requests.copy(start = TownUiState.StartStatus.Waiting(building)))
        viewModelScope.launch {
            when (val answer: TownWorkResult = towns.startWork(building)) {
                is TownWorkResult.Answered -> restartFrom(answer.town, requests.startAnswered())
                is TownWorkResult.Refused ->
                    drawRequests(requests.copy(start = TownUiState.StartStatus.Refused(building, answer.refusal)))
                TownWorkResult.Unreachable ->
                    drawRequests(requests.copy(start = TownUiState.StartStatus.Unreachable(building)))
            }
        }
    }

    private fun stop(target: TownUiState.WorkTarget) {
        if (shown == null || requests.stop is TownUiState.StopStatus.Waiting) return
        drawRequests(requests.copy(stop = TownUiState.StopStatus.Waiting(target)))
        viewModelScope.launch {
            when (val answer: TownWorkResult = towns.stopWork(target.building, target.level)) {
                is TownWorkResult.Answered -> restartFrom(answer.town, requests.stopAnswered())
                is TownWorkResult.Refused ->
                    drawRequests(requests.copy(stop = TownUiState.StopStatus.Refused(target, answer.refusal)))
                TownWorkResult.Unreachable ->
                    drawRequests(requests.copy(stop = TownUiState.StopStatus.Unreachable(target)))
            }
        }
    }

    private fun signOut() {
        viewModelScope.coroutineContext.cancelChildren()
        _state.value = TownUiState.SigningOut(isLeavingNaming = _state.value is TownUiState.Naming)
        viewModelScope.launch {
            _effects.send(TownEffect.SigningOut)
            sessions.signOut()
            _effects.send(TownEffect.SignedOut)
        }
    }

    private fun restartFrom(snapshot: TownSnapshot, kept: TownRequests) {
        projection?.cancel()
        requests = kept
        draw(snapshot)
        if (isShown) projection = viewModelScope.launch { project(snapshot) }
    }

    private fun drawRequests(next: TownRequests) {
        requests = next
        val last: TownSnapshot = shown ?: return
        if (_state.value is TownUiState.Content) draw(last)
    }

    private fun draw(snapshot: TownSnapshot) {
        if (snapshot !== shown) registerRead(snapshot)
        _state.value = snapshot.contentAt(
            now = serverNow(),
            gap = gap,
            requests = requests,
            registered = registered,
            hireEntries = hiring.entries,
            closed = guidance.closed,
        )
    }

    private fun registerRead(read: TownSnapshot) {
        registered = shown?.let { held: TownSnapshot -> registeredBetween(held, read) } ?: TownRegistered.nothing
        shown = read
        guidance.resendUnsent()
    }

    private suspend fun project(first: TownSnapshot, firstReadAt: Instant? = null) {
        var snapshot: TownSnapshot = first
        var nextReadAt: Instant? = firstReadAt
        while (true) {
            draw(snapshot)
            val now: Instant = serverNow()
            val isReadAllowed: Boolean = nextReadAt == null || nextReadAt <= now
            if (isReadAllowed && snapshot.isDueAt(now)) {
                when (val answer: TownReadResult = towns.read()) {
                    is TownReadResult.Read -> {
                        snapshot = measured(answer.town)
                        requests = requests.keptAfterRead()
                        nextReadAt = null
                        draw(snapshot)
                    }
                    TownReadResult.NoTown -> return askName()
                    TownReadResult.Unreachable -> nextReadAt = serverNow() + failedReadRetry
                }
            }
            delay(snapshot.nextWakeFrom(serverNow(), nextReadAt, _state.value.nearestReadyLeft()))
        }
    }

    private fun serverNow(): Instant = clock.now() + gap

    private fun measured(read: TownSnapshot): TownSnapshot {
        gap = read.readAt - clock.now()
        return read
    }
}

private fun TownSnapshot.nextWakeFrom(now: Instant, nextReadAt: Instant?, readyLeft: Duration?): Duration {
    val repaint: Duration = repaintDelay(listOfNotNull(nearestCountdownAt(now), readyLeft).minOrNull())
    return if (nextReadAt == null) repaint else minOf(repaint, nextReadAt - now)
}
