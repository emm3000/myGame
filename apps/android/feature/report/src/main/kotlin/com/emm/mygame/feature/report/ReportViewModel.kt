package com.emm.mygame.feature.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.report.ReportCloseResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.ReportRepository
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.ReadAnswer
import com.emm.mygame.core.model.town.TownReader
import com.emm.mygame.core.model.town.readUntilReached
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class ReportViewModel(
    private val reports: ReportRepository,
    private val towns: TownReader,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<ReportUiState> = MutableStateFlow(ReportUiState.Loading)

    val state: StateFlow<ReportUiState> = _state.asStateFlow()

    private val _effects: Channel<ReportEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<ReportEffect> = _effects.receiveAsFlow()

    private var reading: Job? = null

    private var waiting: Job? = null

    private var lessonWaiting: Job? = null

    private var lessonEnd: Instant? = null

    private var isShown: Boolean = true

    init {
        open()
        viewModelScope.launch { towns.town.collect(::holdLessonEnd) }
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
            ReportUiState.Failed, is ReportUiState.Content -> readAgain()
        }
        awaitLessonEnd()
    }

    private fun hide() {
        isShown = false
        reading?.cancel()
        waiting?.cancel()
        lessonWaiting?.cancel()
    }

    private fun holdLessonEnd(held: HeldTown?) {
        val end: Instant = held?.lessonEndOnDevice() ?: return
        if (end == lessonEnd) return
        lessonEnd = end
        if (isShown) awaitLessonEnd()
    }

    private fun awaitLessonEnd() {
        val wait: Duration = (lessonEnd ?: return) - clock.now()
        if (wait <= Duration.ZERO) return
        lessonWaiting?.cancel()
        lessonWaiting = viewModelScope.launch {
            delay(wait)
            readAgain()
        }
    }

    private fun open() {
        _state.value = ReportUiState.Loading
        readAgain()
    }

    private fun readAgain() {
        reading?.cancel()
        reading = viewModelScope.launch {
            val report: TownReport = readUntilReached(::readReport, onUnreachable = ::drawFailed) ?: return@launch
            draw(report)
        }
    }

    private suspend fun readReport(): ReadAnswer<TownReport> = when (val answer: ReportReadResult = reports.read()) {
        is ReportReadResult.Read -> ReadAnswer.Read(answer.report)
        ReportReadResult.Unreachable -> ReadAnswer.Unreachable
    }

    private fun drawFailed() {
        _state.update { current: ReportUiState ->
            if (current == ReportUiState.Loading) ReportUiState.Failed else current
        }
    }

    private fun close() {
        val unread: ReportUiState.ReportNews.Unread = unreadNews() ?: return
        if (unread.close == ReportUiState.CloseRequest.Waiting) return
        drawClose(ReportUiState.CloseRequest.Waiting)
        viewModelScope.launch {
            when (reports.close()) {
                ReportCloseResult.Closed -> {
                    drawClosed()
                    _effects.send(ReportEffect.NewsClosed)
                }
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
            nextReview = report.nextDueAt,
            news = newsOf(report),
            receivedAt = clock.now(),
        )
        awaitNextReview(report)
    }

    private fun awaitNextReview(report: TownReport) {
        waiting?.cancel()
        val dueAt: Instant = report.nextDueAt ?: return
        val wait: Duration = dueAt - clock.now()
        if (report.dueCount > 0 || wait <= Duration.ZERO) return
        waiting = viewModelScope.launch {
            delay(wait)
            readAgain()
        }
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

private fun HeldTown.lessonEndOnDevice(): Instant? = town.lessonSlot?.finishesAt?.minus(gap)
