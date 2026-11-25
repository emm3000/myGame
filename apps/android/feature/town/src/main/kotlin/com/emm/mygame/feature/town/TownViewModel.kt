package com.emm.mygame.feature.town

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.account.SessionRepository
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.ReadAnswer
import com.emm.mygame.core.model.town.ReadFollower
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.failedReadRetry
import com.emm.mygame.core.model.town.gapOf
import com.emm.mygame.core.model.town.serverNow
import com.emm.mygame.core.projection.repaintDelay
import com.emm.mygame.feature.town.building.BuildingRequests
import com.emm.mygame.feature.town.building.work.WorkTarget
import com.emm.mygame.feature.town.guidance.GuidanceRequests
import com.emm.mygame.feature.town.hiring.HiringRequests
import com.emm.mygame.feature.town.naming.NamingRequests
import com.emm.mygame.feature.town.naming.NamingStatus
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelChildren
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant

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

    private var shown: ShownTown? = null

    private var requests: TownRequests = TownRequests.none

    private var gap: Duration = Duration.ZERO

    private var isOnScreen: Boolean = true

    private val naming: NamingRequests = NamingRequests(
        towns = towns,
        scope = viewModelScope,
        asked = { _state.value as? TownUiState.Naming },
        onStatus = { status: NamingStatus ->
            updateNaming { current: TownUiState.Naming -> current.copy(status = status) }
        },
        onFounded = { town: TownSnapshot -> restartFrom(measured(town), TownRequests.none) },
    )

    private val building: BuildingRequests = BuildingRequests(
        towns = towns,
        scope = viewModelScope,
        requests = { requests },
        onDrawn = ::drawRequests,
        onAnswered = ::restartFrom,
    )

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

    private val follower: ReadFollower<TownSnapshot> = object : ReadFollower<TownSnapshot>() {
        override fun now(): Instant = serverNow(clock, gap)

        override fun draw(held: TownSnapshot): Unit = this@TownViewModel.draw(held)

        override suspend fun read(): ReadAnswer<TownSnapshot> = when (val answer: TownReadResult = towns.read()) {
            is TownReadResult.Read -> {
                requests = requests.keptAfterRead()
                ReadAnswer.Read(measured(answer.town))
            }
            TownReadResult.NoTown -> {
                askName()
                ReadAnswer.Ended
            }
            TownReadResult.Unreachable -> ReadAnswer.Unreachable
        }

        override fun isReadDue(held: TownSnapshot, nextReadAt: Instant?, now: Instant): Boolean =
            (nextReadAt == null || nextReadAt <= now) && held.isDueAt(now)

        override fun nextReadAfter(held: TownSnapshot, now: Instant): Instant? = null

        override fun repaintIn(held: TownSnapshot, now: Instant): Duration =
            repaintDelay(listOfNotNull(held.nearestCountdownAt(now), _state.value.nearestReadyLeft()).minOrNull())
    }

    init {
        open()
    }

    fun onIntent(intent: TownIntent) {
        if (_state.value is TownUiState.SigningOut) return
        when (intent) {
            TownIntent.ScreenShown -> show()
            TownIntent.ScreenHidden -> {
                isOnScreen = false
                projection?.cancel()
            }
            TownIntent.RetryTapped -> if (_state.value == TownUiState.Failed) open()
            TownIntent.GoToTownTapped -> open()
            is TownIntent.NameChanged ->
                updateNaming { current: TownUiState.Naming -> current.copy(name = intent.name) }
            TownIntent.NameSubmitted -> naming.found()
            is TownIntent.BuildTapped -> ifTownShown { building.start(intent.building) }
            is TownIntent.StopTapped -> ifTownShown { building.stop(WorkTarget(intent.building, intent.level)) }
            is TownIntent.HiringEntryChanged -> hiring.enter(intent.hire, intent.entry)
            is TownIntent.PlaceHiringTapped -> ifTownShown { hiring.place(intent.hire) }
            is TownIntent.StopHiringTapped -> ifTownShown { hiring.stop(intent.target) }
            is TownIntent.TipClosed -> ifTownShown { guidance.closeTip(intent.tip) }
            TownIntent.GoalClosed -> ifTownShown { guidance.closeGoal() }
            TownIntent.SignOutTapped -> signOut()
        }
    }

    private inline fun ifTownShown(act: () -> Unit) {
        if (shown != null) act()
    }

    private fun show() {
        if (isOnScreen) return
        isOnScreen = true
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
                is TownReadResult.Read -> follower.follow(measured(answer.town), firstReadAt = null)
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
        val last: TownSnapshot = shown?.snapshot ?: return
        projection = viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> {
                    requests = requests.keptAfterRead()
                    follower.follow(measured(answer.town), firstReadAt = null)
                }
                TownReadResult.NoTown -> askName()
                TownReadResult.Unreachable -> follower.follow(last, serverNow(clock, gap) + failedReadRetry)
            }
        }
    }

    private fun askName() {
        shown = null
        _state.value = TownUiState.Naming(name = "", status = NamingStatus.Idle)
    }

    private fun updateNaming(change: (TownUiState.Naming) -> TownUiState.Naming) {
        _state.update { current: TownUiState -> if (current is TownUiState.Naming) change(current) else current }
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
        if (isOnScreen) projection = viewModelScope.launch { follower.follow(snapshot, firstReadAt = null) }
    }

    private fun drawRequests(next: TownRequests) {
        requests = next
        val last: TownSnapshot = shown?.snapshot ?: return
        if (_state.value is TownUiState.Content) draw(last)
    }

    private fun draw(snapshot: TownSnapshot) {
        val drawn: ShownTown = shown?.takeIf { held: ShownTown -> held.snapshot === snapshot } ?: registerRead(snapshot)
        _state.value = snapshot.contentAt(
            now = serverNow(clock, gap),
            gap = gap,
            requests = requests,
            registered = drawn.registered,
            hiringEntries = hiring.entries,
            closed = guidance.closed,
        )
    }

    private fun registerRead(read: TownSnapshot): ShownTown {
        val next: ShownTown = shown?.followedBy(read) ?: ShownTown.firstOf(read)
        shown = next
        guidance.resendUnsent()
        return next
    }

    private fun measured(read: TownSnapshot): TownSnapshot {
        gap = gapOf(read.readAt, clock)
        return read
    }
}
