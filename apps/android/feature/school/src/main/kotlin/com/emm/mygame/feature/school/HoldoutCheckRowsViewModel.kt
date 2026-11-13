package com.emm.mygame.feature.school

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.HoldoutChecksReadResult
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class HoldoutCheckRowsViewModel(private val holdoutChecks: HoldoutCheckRepository) : ViewModel() {

    private val _state: MutableStateFlow<HoldoutCheckRowsUiState> =
        MutableStateFlow(HoldoutCheckRowsUiState(emptyList()))

    val state: StateFlow<HoldoutCheckRowsUiState> = _state.asStateFlow()

    private var reading: Job? = null

    fun onIntent(intent: HoldoutCheckRowsIntent) {
        when (intent) {
            HoldoutCheckRowsIntent.ScreenShown -> read()
            HoldoutCheckRowsIntent.ScreenHidden -> reading?.cancel()
        }
    }

    private fun read() {
        reading?.cancel()
        reading = viewModelScope.launch {
            _state.value = when (val answer: HoldoutChecksReadResult = holdoutChecks.read()) {
                is HoldoutChecksReadResult.Read -> HoldoutCheckRowsUiState(answer.checks.map(::rowOf))
                HoldoutChecksReadResult.Unreachable -> HoldoutCheckRowsUiState(emptyList())
            }
        }
    }

    private fun rowOf(check: HoldoutCheck): HoldoutCheckRow = HoldoutCheckRow(check.band, check.week)
}
