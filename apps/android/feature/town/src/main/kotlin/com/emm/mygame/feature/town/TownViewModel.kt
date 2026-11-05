package com.emm.mygame.feature.town

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.TownWorkResult
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant
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

    private var mutations: TownMutations = TownMutations.none

    private var gap: Duration = Duration.ZERO

    private var isShown: Boolean = true

    init {
        open()
    }

    fun onIntent(intent: TownIntent) {
        if (_state.value == TownUiState.SigningOut) return
        when (intent) {
            TownIntent.ScreenShown -> show()
            TownIntent.ScreenHidden -> {
                isShown = false
                projection?.cancel()
            }
            TownIntent.RetryTapped -> if (_state.value == TownUiState.Failed) open()
            TownIntent.GoToTownTapped -> open()
            TownIntent.SignOutTapped -> signOut()
            is TownIntent.NameChanged -> rename(intent.name)
            TownIntent.NameSubmitted -> found()
            is TownIntent.BuildTapped -> start(intent.building)
            is TownIntent.StopTapped -> stop(TownUiState.WorkTarget(intent.building, intent.level))
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
        _state.value = TownUiState.Loading
        projection = viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> project(measured(answer.town))
                TownReadResult.NoTown -> askName()
                TownReadResult.Unreachable -> _state.value = TownUiState.Failed
            }
        }
    }

    private fun reread() {
        val last: TownSnapshot = shown ?: return
        projection = viewModelScope.launch {
            when (val answer: TownReadResult = towns.read()) {
                is TownReadResult.Read -> {
                    mutations = mutations.keptAfterRead()
                    project(measured(answer.town))
                }
                TownReadResult.NoTown -> askName()
                TownReadResult.Unreachable -> project(last)
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
                is TownFoundResult.Founded -> restartFrom(measured(answer.town), TownMutations.none)
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
        if (shown == null || mutations.start is TownUiState.StartStatus.Waiting) return
        drawMutations(mutations.copy(start = TownUiState.StartStatus.Waiting(building)))
        viewModelScope.launch {
            when (val answer: TownWorkResult = towns.startWork(building)) {
                is TownWorkResult.Answered -> restartFrom(answer.town, mutations.startAnswered())
                is TownWorkResult.Refused ->
                    drawMutations(mutations.copy(start = TownUiState.StartStatus.Refused(building, answer.refusal)))
                TownWorkResult.Unreachable ->
                    drawMutations(mutations.copy(start = TownUiState.StartStatus.Unreachable(building)))
            }
        }
    }

    private fun stop(target: TownUiState.WorkTarget) {
        if (shown == null || mutations.stop is TownUiState.StopStatus.Waiting) return
        drawMutations(mutations.copy(stop = TownUiState.StopStatus.Waiting(target)))
        viewModelScope.launch {
            when (val answer: TownWorkResult = towns.stopWork(target.building, target.level)) {
                is TownWorkResult.Answered -> restartFrom(answer.town, mutations.stopAnswered())
                is TownWorkResult.Refused ->
                    drawMutations(mutations.copy(stop = TownUiState.StopStatus.Refused(target, answer.refusal)))
                TownWorkResult.Unreachable ->
                    drawMutations(mutations.copy(stop = TownUiState.StopStatus.Unreachable(target)))
            }
        }
    }

    private fun signOut() {
        viewModelScope.coroutineContext.cancelChildren()
        _state.value = TownUiState.SigningOut
        viewModelScope.launch {
            sessions.signOut()
            _effects.send(TownEffect.SignedOut)
        }
    }

    private fun restartFrom(snapshot: TownSnapshot, kept: TownMutations) {
        projection?.cancel()
        mutations = kept
        draw(snapshot)
        if (isShown) projection = viewModelScope.launch { project(snapshot) }
    }

    private fun drawMutations(next: TownMutations) {
        mutations = next
        _state.update { current: TownUiState ->
            if (current is TownUiState.Content) current.copy(start = next.start, stop = next.stop) else current
        }
    }

    private fun draw(snapshot: TownSnapshot) {
        shown = snapshot
        _state.value = snapshot.contentAt(now = serverNow(), gap = gap, mutations = mutations)
    }

    private suspend fun project(first: TownSnapshot) {
        var snapshot: TownSnapshot = first
        while (true) {
            draw(snapshot)
            if (snapshot.isDueAt(serverNow())) {
                when (val answer: TownReadResult = towns.read()) {
                    is TownReadResult.Read -> {
                        snapshot = measured(answer.town)
                        mutations = mutations.keptAfterRead()
                        draw(snapshot)
                    }
                    TownReadResult.NoTown -> return askName()
                    TownReadResult.Unreachable -> Unit
                }
            }
            delay(repaintDelay(snapshot.nearestCountdownAt(serverNow())))
        }
    }

    private fun serverNow(): Instant = clock.now() + gap

    private fun measured(read: TownSnapshot): TownSnapshot {
        gap = read.readAt - clock.now()
        return read
    }
}
