package com.emm.mygame.feature.today

import com.emm.mygame.core.model.report.ReportCloseResult
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.ReportRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlin.time.Clock

internal class TodayNews(
    private val reports: ReportRepository,
    private val scope: CoroutineScope,
    private val clock: Clock,
    private val onChange: () -> Unit,
) {

    var whatHappened: TodayUiState.WhatHappened? = null
        private set

    private var reading: Job? = null

    fun read() {
        if (reading?.isActive == true) return
        reading = scope.launch {
            val answer: ReportReadResult.Read = reports.read() as? ReportReadResult.Read ?: return@launch
            whatHappened = whatHappenedOf(answer.report.news, clock.now(), closeKept())
            onChange()
        }
    }

    fun close() {
        val shown: TodayUiState.WhatHappened = whatHappened ?: return
        if (shown.close == TodayUiState.NewsClose.Waiting) return
        whatHappened = shown.copy(close = TodayUiState.NewsClose.Waiting)
        onChange()
        scope.launch {
            when (reports.close()) {
                ReportCloseResult.Closed -> closed()
                ReportCloseResult.Unreachable ->
                    whatHappened = whatHappened?.copy(close = TodayUiState.NewsClose.Unreachable)
            }
            onChange()
        }
    }

    private fun closed() {
        reading?.cancel()
        whatHappened = null
    }

    private fun closeKept(): TodayUiState.NewsClose =
        if (whatHappened?.close == TodayUiState.NewsClose.Waiting) {
            TodayUiState.NewsClose.Waiting
        } else {
            TodayUiState.NewsClose.Idle
        }
}
