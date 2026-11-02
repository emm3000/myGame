package com.emm.mygame.feature.fief

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.UpgradeResult
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class FiefViewModel(private val fiefs: FiefRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<FiefUiState> = MutableStateFlow(FiefUiState.Loading)

    val state: StateFlow<FiefUiState> = _state.asStateFlow()

    private var projection: Job? = null

    private var shown: FiefSnapshot? = null

    private var upgrade: FiefUiState.UpgradeStatus = FiefUiState.UpgradeStatus.Idle

    init {
        open()
    }

    fun onIntent(intent: FiefIntent) {
        when (intent) {
            FiefIntent.RetryTapped -> open()
            is FiefIntent.UpgradeTapped -> upgrade(intent.building)
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

    private fun upgrade(building: BuildingKind) {
        val fief: FiefSnapshot = shown ?: return
        if (upgrade is FiefUiState.UpgradeStatus.Waiting) return
        drawUpgrade(FiefUiState.UpgradeStatus.Waiting(building))
        viewModelScope.launch {
            when (val answer: UpgradeResult = fiefs.upgrade(fief.id, building)) {
                is UpgradeResult.Upgraded -> restartFrom(answer.fief)
                is UpgradeResult.Refused -> drawUpgrade(FiefUiState.UpgradeStatus.Refused(building, answer.refusal))
                UpgradeResult.Unreachable -> drawUpgrade(FiefUiState.UpgradeStatus.Unreachable(building))
            }
        }
    }

    private fun restartFrom(snapshot: FiefSnapshot) {
        projection?.cancel()
        upgrade = FiefUiState.UpgradeStatus.Idle
        projection = viewModelScope.launch { project(snapshot) }
    }

    private fun drawUpgrade(status: FiefUiState.UpgradeStatus) {
        upgrade = status
        _state.update { current: FiefUiState ->
            if (current is FiefUiState.Content) current.copy(upgrade = status) else current
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
                    forgetAnsweredUpgrade()
                }
            }
            val now: Instant = clock.now() + gap
            shown = snapshot
            _state.value = snapshot.contentAt(now, upgrade)
            delay(repaintDelay(snapshot.slotRemainingAt(now)))
        }
    }

    private fun forgetAnsweredUpgrade() {
        if (upgrade !is FiefUiState.UpgradeStatus.Waiting) upgrade = FiefUiState.UpgradeStatus.Idle
    }

    private fun serverGapOf(snapshot: FiefSnapshot): Duration = snapshot.readAt - clock.now()
}
