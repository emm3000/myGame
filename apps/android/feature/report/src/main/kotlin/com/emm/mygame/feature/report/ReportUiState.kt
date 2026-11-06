package com.emm.mygame.feature.report

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownNews
import kotlin.time.Instant

sealed interface ReportUiState {

    data object Loading : ReportUiState

    data object Failed : ReportUiState

    data class Content(
        val dueCount: Int,
        val firstUnread: LessonId?,
        val news: ReportNews,
        val receivedAt: Instant,
    ) : ReportUiState

    sealed interface ReportNews {

        data object None : ReportNews

        data object Closed : ReportNews

        data class Unread(val items: List<TownNews>, val close: CloseRequest) : ReportNews
    }

    sealed interface CloseRequest {

        data object Idle : CloseRequest

        data object Waiting : CloseRequest

        data object Unreachable : CloseRequest
    }
}
