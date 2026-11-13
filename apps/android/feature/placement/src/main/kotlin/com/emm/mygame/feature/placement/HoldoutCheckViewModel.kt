package com.emm.mygame.feature.placement

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.HoldoutCheckChangeResult
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.HoldoutChecksReadResult
import com.emm.mygame.core.network.PlacementAnswer
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class HoldoutCheckViewModel(
    private val holdoutChecks: HoldoutCheckRepository,
    private val band: PlacementBand,
    private val week: HoldoutCheckWeek,
) : ViewModel() {

    private val _state: MutableStateFlow<HoldoutCheckUiState> = MutableStateFlow(HoldoutCheckUiState.Loading)

    val state: StateFlow<HoldoutCheckUiState> = _state.asStateFlow()

    init {
        read()
    }

    fun onIntent(intent: HoldoutCheckIntent) {
        when (intent) {
            HoldoutCheckIntent.RetryTapped -> if (_state.value == HoldoutCheckUiState.Failed) read()
            HoldoutCheckIntent.StartTapped -> decide(HoldoutCheckAction.Begin) { holdoutChecks.begin(band, week) }
            HoldoutCheckIntent.SkipTapped -> decide(HoldoutCheckAction.Skip) { holdoutChecks.skip(band, week) }
            is HoldoutCheckIntent.ChoiceChosen -> choose(intent.choice)
            HoldoutCheckIntent.NextTapped -> showNext()
            HoldoutCheckIntent.AnswersSent -> sendAnswers()
        }
    }

    private fun read() {
        _state.value = HoldoutCheckUiState.Loading
        viewModelScope.launch {
            _state.value = when (val answer: HoldoutChecksReadResult = holdoutChecks.read()) {
                is HoldoutChecksReadResult.Read -> stateOf(answer.checks)
                HoldoutChecksReadResult.Unreachable -> HoldoutCheckUiState.Failed
            }
        }
    }

    private fun decide(action: HoldoutCheckAction, change: suspend () -> HoldoutCheckChangeResult) {
        val due: HoldoutCheckUiState.Due = _state.value as? HoldoutCheckUiState.Due ?: return
        if (due.request is HoldoutCheckRequest.Waiting) return
        _state.value = due.copy(request = HoldoutCheckRequest.Waiting(action))
        viewModelScope.launch { answered(action, change()) }
    }

    private fun choose(choice: ChoiceId) {
        val asking: HoldoutCheckUiState.Asking = idleAsking() ?: return
        val shown: PlacementItem = asking.shown ?: return
        _state.value = asking.copy(
            chosen = asking.chosen + (shown.word to choice),
            request = HoldoutCheckRequest.Idle,
        )
    }

    private fun showNext() {
        val asking: HoldoutCheckUiState.Asking = idleAsking() ?: return
        if (asking.chosenForShown == null || asking.isLastShown) return
        _state.value = asking.copy(shownIndex = asking.shownIndex + 1)
    }

    private fun sendAnswers() {
        val asking: HoldoutCheckUiState.Asking = idleAsking() ?: return
        if (!asking.isLastShown) return
        val answers: List<PlacementAnswer> = asking.items.mapNotNull { item: PlacementItem ->
            asking.chosen[item.word]?.let { choice: ChoiceId -> PlacementAnswer(item.word, choice) }
        }
        if (answers.size != asking.items.size) return
        _state.value = asking.copy(request = HoldoutCheckRequest.Waiting(HoldoutCheckAction.Answers))
        viewModelScope.launch {
            answered(HoldoutCheckAction.Answers, holdoutChecks.answer(band, week, answers))
        }
    }

    private fun idleAsking(): HoldoutCheckUiState.Asking? {
        val asking: HoldoutCheckUiState.Asking = _state.value as? HoldoutCheckUiState.Asking ?: return null
        return if (asking.request is HoldoutCheckRequest.Waiting) null else asking
    }

    private fun answered(action: HoldoutCheckAction, answer: HoldoutCheckChangeResult) {
        when (answer) {
            is HoldoutCheckChangeResult.Changed -> _state.value = changedStateOf(action, answer.checks)
            is HoldoutCheckChangeResult.Refused -> drawRequest(HoldoutCheckRequest.Refused)
            HoldoutCheckChangeResult.Unreachable -> drawRequest(HoldoutCheckRequest.Unreachable)
        }
    }

    private fun changedStateOf(action: HoldoutCheckAction, checks: List<HoldoutCheck>): HoldoutCheckUiState =
        when (action) {
            HoldoutCheckAction.Begin -> stateOf(checks)
            HoldoutCheckAction.Skip, HoldoutCheckAction.Answers -> HoldoutCheckUiState.Done
        }

    private fun drawRequest(request: HoldoutCheckRequest) {
        _state.update { current: HoldoutCheckUiState ->
            when (current) {
                is HoldoutCheckUiState.Due -> current.copy(request = request)
                is HoldoutCheckUiState.Asking -> current.copy(request = request)
                HoldoutCheckUiState.Loading,
                HoldoutCheckUiState.Failed,
                HoldoutCheckUiState.NotOpen,
                HoldoutCheckUiState.Done,
                -> current
            }
        }
    }

    private fun stateOf(checks: List<HoldoutCheck>): HoldoutCheckUiState {
        val check: HoldoutCheck = checks.firstOrNull { it.band == band && it.week == week }
            ?: return HoldoutCheckUiState.NotOpen
        return when (check) {
            is HoldoutCheck.Due -> HoldoutCheckUiState.Due(band, week, HoldoutCheckRequest.Idle)
            is HoldoutCheck.Asking -> HoldoutCheckUiState.Asking(
                band = band,
                week = week,
                items = check.items,
                shownIndex = 0,
                chosen = emptyMap(),
                request = HoldoutCheckRequest.Idle,
            )
        }
    }
}
