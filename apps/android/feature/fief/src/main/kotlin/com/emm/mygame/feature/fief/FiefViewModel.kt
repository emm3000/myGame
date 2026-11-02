package com.emm.mygame.feature.fief

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class FiefViewModel(private val fiefs: FiefRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<FiefUiState> = MutableStateFlow(FiefUiState.Loading)

    val state: StateFlow<FiefUiState> = _state.asStateFlow()

    private var projection: Job? = null

    init {
        open()
    }

    fun onIntent(intent: FiefIntent) {
        when (intent) {
            FiefIntent.RetryTapped -> open()
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

    private suspend fun project(first: FiefSnapshot) {
        var snapshot: FiefSnapshot = first
        var gap: Duration = serverGapOf(snapshot)
        while (true) {
            if (snapshot.slotRemainingAt(clock.now() + gap) == Duration.ZERO) {
                val answer: FiefReadResult = fiefs.read()
                if (answer is FiefReadResult.Read) {
                    snapshot = answer.fief
                    gap = serverGapOf(snapshot)
                }
            }
            val now: Instant = clock.now() + gap
            _state.value = snapshot.contentAt(now)
            delay(repaintDelay(snapshot.slotRemainingAt(now)))
        }
    }

    private fun serverGapOf(snapshot: FiefSnapshot): Duration = snapshot.readAt - clock.now()
}
