package com.emm.mygame.feature.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.ReportCloseResult
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.TownReport
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

private val failedReadRetry: Duration = 1.minutes

class ReportViewModel(private val reports: ReportRepository, private val clock: Clock) : ViewModel() {

    private val _state: MutableStateFlow<ReportUiState> = MutableStateFlow(ReportUiState.Loading)

    val state: StateFlow<ReportUiState> = _state.asStateFlow()

    private var reading: Job? = null

    private var isShown: Boolean = true

    init {
        open()
    }

    fun onIntent(intent: ReportIntent) {
        when (intent) {
            ReportIntent.ScreenShown -> show()
            ReportIntent.ScreenHidden -> hide()
            ReportIntent.RetryTapped -> if (_state.value == ReportUiState.Failed) open()
            ReportIntent.CloseTapped -> close()
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        when (_state.value) {
            ReportUiState.Loading -> open()
            ReportUiState.Failed -> Unit
            is ReportUiState.Content -> readAgain()
        }
    }

    private fun hide() {
        isShown = false
        reading?.cancel()
    }

    private fun open() {
        _state.value = ReportUiState.Loading
        reading = viewModelScope.launch {
            when (val answer: ReportReadResult = reports.read()) {
                is ReportReadResult.Read -> draw(answer.report)
                ReportReadResult.Unreachable -> _state.value = ReportUiState.Failed
            }
        }
    }

    private fun readAgain() {
        reading = viewModelScope.launch {
            while (true) {
                when (val answer: ReportReadResult = reports.read()) {
                    is ReportReadResult.Read -> return@launch draw(answer.report)
                    ReportReadResult.Unreachable -> delay(failedReadRetry)
                }
            }
        }
    }

    private fun close() {
        val unread: ReportUiState.ReportNews.Unread = unreadNews() ?: return
        if (unread.close == ReportUiState.CloseRequest.Waiting) return
        drawClose(ReportUiState.CloseRequest.Waiting)
        viewModelScope.launch {
            when (reports.close()) {
                ReportCloseResult.Closed -> drawClosed()
                ReportCloseResult.Unreachable -> drawClose(ReportUiState.CloseRequest.Unreachable)
            }
        }
    }

    private fun drawClosed() {
        val wasReading: Boolean = reading?.isActive == true
        reading?.cancel()
        _state.update { current: ReportUiState ->
            if (current is ReportUiState.Content) current.copy(news = ReportUiState.ReportNews.Closed) else current
        }
        if (wasReading) readAgain()
    }

    private fun drawClose(request: ReportUiState.CloseRequest) {
        val unread: ReportUiState.ReportNews.Unread = unreadNews() ?: return
        _state.update { current: ReportUiState ->
            if (current is ReportUiState.Content) current.copy(news = unread.copy(close = request)) else current
        }
    }

    private fun unreadNews(): ReportUiState.ReportNews.Unread? =
        (_state.value as? ReportUiState.Content)?.news as? ReportUiState.ReportNews.Unread

    private fun draw(report: TownReport) {
        _state.value = ReportUiState.Content(
            dueCount = report.dueCount,
            firstUnread = report.readFirst.firstOrNull(),
            news = newsOf(report),
            receivedAt = clock.now(),
        )
    }

    private fun newsOf(report: TownReport): ReportUiState.ReportNews {
        val drawn: ReportUiState.ReportNews? = (_state.value as? ReportUiState.Content)?.news
        return when {
            report.news.isNotEmpty() -> ReportUiState.ReportNews.Unread(report.news, closeAfterRead())
            drawn == ReportUiState.ReportNews.Closed -> ReportUiState.ReportNews.Closed
            else -> ReportUiState.ReportNews.None
        }
    }

    private fun closeAfterRead(): ReportUiState.CloseRequest =
        if (unreadNews()?.close == ReportUiState.CloseRequest.Waiting) {
            ReportUiState.CloseRequest.Waiting
        } else {
            ReportUiState.CloseRequest.Idle
        }
}
