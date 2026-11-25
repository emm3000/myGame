package com.emm.mygame.feature.report.news

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.time.Clock

class NewsViewModel(
    private val reports: ReportRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<NewsUiState> = MutableStateFlow(NewsUiState.Loading)

    val state: StateFlow<NewsUiState> = _state.asStateFlow()

    init {
        read()
    }

    fun onIntent(intent: NewsIntent) {
        when (intent) {
            NewsIntent.RetryTapped -> if (_state.value == NewsUiState.Failed) read()
        }
    }

    private fun read() {
        _state.value = NewsUiState.Loading
        viewModelScope.launch {
            _state.value = when (val answer: TownNewsReadResult = reports.news()) {
                is TownNewsReadResult.Read -> NewsUiState.Content(answer.news, clock.now())
                TownNewsReadResult.Unreachable -> NewsUiState.Failed
            }
        }
    }
}
