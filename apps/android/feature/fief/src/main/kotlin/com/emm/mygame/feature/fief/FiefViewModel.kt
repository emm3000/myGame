package com.emm.mygame.feature.fief

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.CancelRefusal
import com.emm.mygame.core.network.CancelResult
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.UpgradeResult
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

class FiefViewModel(
    private val fiefs: FiefRepository,
    private val sessions: SessionRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<FiefUiState> = MutableStateFlow(FiefUiState.Loading)

    val state: StateFlow<FiefUiState> = _state.asStateFlow()

    private val _effects: Channel<FiefEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<FiefEffect> = _effects.receiveAsFlow()

    private var projection: Job? = null

    private var shown: FiefSnapshot? = null

    private var mutations: Mutations = Mutations.none

    init {
        open()
    }

    fun onIntent(intent: FiefIntent) {
        if (_state.value == FiefUiState.SigningOut) return
        when (intent) {
            FiefIntent.RetryTapped -> open()
            FiefIntent.SignOutTapped -> signOut()
            is FiefIntent.UpgradeTapped -> upgrade(intent.building)
            is FiefIntent.CancelTapped -> cancel(FiefUiState.UpgradeTarget(intent.building, intent.targetLevel))
        }
    }

    private fun open() {
        projection?.cancel()
        _state.value = FiefUiState.Loading
        projection = viewModelScope.launch {
            when (val answer: FiefReadResult = fiefs.read()) {
                FiefReadResult.Unreachable -> _state.value = FiefUiState.Failed
                is FiefReadResult.Read -> project(answer.fief)
            }
        }
    }

    private fun signOut() {
        viewModelScope.coroutineContext.cancelChildren()
        _state.value = FiefUiState.SigningOut
        viewModelScope.launch {
            sessions.signOut()
            _effects.send(FiefEffect.SignedOut)
        }
    }

    private fun upgrade(building: BuildingKind) {
        val fief: FiefSnapshot = shown ?: return
        if (mutations.upgrade is FiefUiState.UpgradeStatus.Waiting) return
        draw(mutations.copy(upgrade = FiefUiState.UpgradeStatus.Waiting(building)))
        viewModelScope.launch {
            when (val answer: UpgradeResult = fiefs.upgrade(fief.id, building)) {
                is UpgradeResult.Upgraded -> restartFrom(answer.fief, mutations.upgradeAnswered())
                is UpgradeResult.Refused ->
                    draw(mutations.copy(upgrade = FiefUiState.UpgradeStatus.Refused(building, answer.refusal)))
                UpgradeResult.Unreachable ->
                    draw(mutations.copy(upgrade = FiefUiState.UpgradeStatus.Unreachable(building)))
            }
        }
    }

    private fun cancel(target: FiefUiState.UpgradeTarget) {
        val fief: FiefSnapshot = shown ?: return
        if (mutations.cancel is FiefUiState.CancelStatus.Waiting) return
        draw(mutations.copy(cancel = FiefUiState.CancelStatus.Waiting(target)))
        viewModelScope.launch {
            when (val answer: CancelResult = fiefs.cancel(fief.id, target.building, target.targetLevel)) {
                is CancelResult.Cancelled -> restartFrom(answer.fief, mutations.cancelAnswered())
                is CancelResult.Refused -> answerRefusedCancel(target, answer.refusal)
                CancelResult.Unreachable -> draw(mutations.copy(cancel = FiefUiState.CancelStatus.Unreachable(target)))
            }
        }
    }

    private suspend fun answerRefusedCancel(target: FiefUiState.UpgradeTarget, refusal: CancelRefusal) {
        when (refusal) {
            CancelRefusal.UpgradeNotFound -> rereadAfterCancel(target)
            CancelRefusal.Unrecognized -> draw(mutations.copy(cancel = FiefUiState.CancelStatus.Refused(target)))
        }
    }

    private suspend fun rereadAfterCancel(target: FiefUiState.UpgradeTarget) {
        when (val answer: FiefReadResult = fiefs.read()) {
            is FiefReadResult.Read -> restartFrom(answer.fief, mutations.cancelAnswered())
            FiefReadResult.Unreachable -> draw(mutations.copy(cancel = FiefUiState.CancelStatus.Unreachable(target)))
        }
    }

    private fun restartFrom(snapshot: FiefSnapshot, kept: Mutations) {
        projection?.cancel()
        mutations = kept
        projection = viewModelScope.launch { project(snapshot) }
    }

    private fun draw(next: Mutations) {
        mutations = next
        _state.update { current: FiefUiState ->
            if (current is FiefUiState.Content) current.copy(upgrade = next.upgrade, cancel = next.cancel) else current
        }
    }

    private suspend fun project(first: FiefSnapshot) {
        var snapshot: FiefSnapshot = first
        var gap: Duration = serverGapOf(snapshot)
        while (true) {
            if (snapshot.slotRemainingAt(clock.now() + gap) == Duration.ZERO) {
                val answer: FiefReadResult = fiefs.read()
                if (answer is FiefReadResult.Read) {
                    snapshot = answer.fief
                    gap = serverGapOf(snapshot)
                    mutations = mutations.keptAfterRead()
                }
            }
            val now: Instant = clock.now() + gap
            shown = snapshot
            _state.value = snapshot.contentAt(now = now, gap = gap, mutations = mutations)
            delay(repaintDelay(snapshot.slotRemainingAt(now)))
        }
    }

    private fun serverGapOf(snapshot: FiefSnapshot): Duration = snapshot.readAt - clock.now()
}
