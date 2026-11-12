package com.emm.mygame.feature.placement

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementAnswer
import com.emm.mygame.core.network.PlacementChangeResult
import com.emm.mygame.core.network.PlacementItem
import com.emm.mygame.core.network.PlacementReadResult
import com.emm.mygame.core.network.PlacementRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class PlacementViewModel(private val placements: PlacementRepository) : ViewModel() {

    private val _state: MutableStateFlow<PlacementUiState> = MutableStateFlow(PlacementUiState.Loading)

    val state: StateFlow<PlacementUiState> = _state.asStateFlow()

    init {
        read()
    }

    fun onIntent(intent: PlacementIntent) {
        when (intent) {
            PlacementIntent.RetryTapped -> if (_state.value == PlacementUiState.Failed) read()
            PlacementIntent.StartTapped -> decide(PlacementAction.Begin) { placements.begin() }
            PlacementIntent.SkipTapped -> decide(PlacementAction.Skip) { placements.skip() }
            is PlacementIntent.ChoiceChosen -> choose(intent.choice)
            PlacementIntent.NextTapped -> showNext()
            PlacementIntent.BandSent -> sendBand()
        }
    }

    private fun read() {
        _state.value = PlacementUiState.Loading
        viewModelScope.launch {
            when (val answer: PlacementReadResult = placements.read()) {
                is PlacementReadResult.Read -> draw(answer.placement)
                PlacementReadResult.Unreachable -> _state.value = PlacementUiState.Failed
            }
        }
    }

    private fun decide(action: PlacementAction, change: suspend () -> PlacementChangeResult) {
        val offered: PlacementUiState.Offered = _state.value as? PlacementUiState.Offered ?: return
        if (offered.request is PlacementRequest.Waiting) return
        _state.value = offered.copy(request = PlacementRequest.Waiting(action))
        viewModelScope.launch { answered(change()) }
    }

    private fun choose(choice: ChoiceId) {
        val asking: PlacementUiState.Asking = idleAsking() ?: return
        _state.value = asking.copy(
            chosen = asking.chosen + (asking.shown.word to choice),
            request = PlacementRequest.Idle,
        )
    }

    private fun showNext() {
        val asking: PlacementUiState.Asking = idleAsking() ?: return
        if (asking.chosenForShown == null || asking.isLastShown) return
        _state.value = asking.copy(shownIndex = asking.shownIndex + 1)
    }

    private fun sendBand() {
        val asking: PlacementUiState.Asking = idleAsking() ?: return
        if (!asking.isLastShown) return
        val answers: List<PlacementAnswer> = asking.items.mapNotNull { item: PlacementItem ->
            asking.chosen[item.word]?.let { choice: ChoiceId -> PlacementAnswer(item.word, choice) }
        }
        if (answers.size != asking.items.size) return
        _state.value = asking.copy(request = PlacementRequest.Waiting(PlacementAction.Answers))
        viewModelScope.launch { answered(placements.answer(asking.band, answers)) }
    }

    private fun idleAsking(): PlacementUiState.Asking? {
        val asking: PlacementUiState.Asking = _state.value as? PlacementUiState.Asking ?: return null
        return if (asking.request is PlacementRequest.Waiting) null else asking
    }

    private fun answered(answer: PlacementChangeResult) {
        when (answer) {
            is PlacementChangeResult.Changed -> draw(answer.placement)
            PlacementChangeResult.Refused -> read()
            PlacementChangeResult.Unreachable -> drawUnreachable()
        }
    }

    private fun drawUnreachable() {
        _state.update { current: PlacementUiState ->
            when (current) {
                is PlacementUiState.Offered -> current.copy(request = PlacementRequest.Unreachable)
                is PlacementUiState.Asking -> current.copy(request = PlacementRequest.Unreachable)
                PlacementUiState.Loading, PlacementUiState.Failed, is PlacementUiState.Closed -> current
            }
        }
    }

    private fun draw(placement: Placement) {
        _state.value = when (placement) {
            Placement.Offered -> PlacementUiState.Offered(PlacementRequest.Idle)
            is Placement.Asking -> PlacementUiState.Asking(
                band = placement.band,
                items = placement.items,
                scores = placement.scores,
                shownIndex = 0,
                chosen = emptyMap(),
                request = PlacementRequest.Idle,
            )
            is Placement.Closed -> PlacementUiState.Closed(placement.scores)
        }
    }
}
