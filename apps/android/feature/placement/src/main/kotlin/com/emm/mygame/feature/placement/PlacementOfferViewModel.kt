package com.emm.mygame.feature.placement

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementReadResult
import com.emm.mygame.core.network.PlacementRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PlacementOfferViewModel(private val placements: PlacementRepository) : ViewModel() {

    private val _state: MutableStateFlow<PlacementOfferUiState> = MutableStateFlow(PlacementOfferUiState.Hidden)

    val state: StateFlow<PlacementOfferUiState> = _state.asStateFlow()

    private var reading: Job? = null

    fun onIntent(intent: PlacementOfferIntent) {
        when (intent) {
            PlacementOfferIntent.ScreenShown -> read()
            PlacementOfferIntent.ScreenHidden -> reading?.cancel()
        }
    }

    private fun read() {
        reading?.cancel()
        reading = viewModelScope.launch {
            _state.value = when (val answer: PlacementReadResult = placements.read()) {
                is PlacementReadResult.Read -> offerOf(answer.placement)
                PlacementReadResult.Unreachable -> PlacementOfferUiState.Hidden
            }
        }
    }

    private fun offerOf(placement: Placement): PlacementOfferUiState = when (placement) {
        Placement.Offered -> PlacementOfferUiState.Offered
        is Placement.Asking -> PlacementOfferUiState.Asking
        is Placement.Closed -> PlacementOfferUiState.Hidden
    }
}
