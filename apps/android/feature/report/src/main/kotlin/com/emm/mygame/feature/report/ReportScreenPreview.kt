package com.emm.mygame.feature.report

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.feature.report.news.previewReceivedAt
import com.emm.mygame.feature.report.news.previewTownNews
import kotlin.time.Instant

private val previewUnread: ReportUiState.ReportNews.Unread = ReportUiState.ReportNews.Unread(
    items = previewTownNews.take(2),
    close = ReportUiState.CloseRequest.Idle,
)

private val previewContent: ReportUiState.Content = ReportUiState.Content(
    dueCount = 3,
    nextReview = null,
    news = previewUnread,
    receivedAt = previewReceivedAt,
    isReminderOn = false,
)

private class ReportUiStates : PreviewParameterProvider<ReportUiState> {

    override val values: Sequence<ReportUiState> = sequenceOf(
        previewContent,
        previewContent.copy(news = ReportUiState.ReportNews.Closed),
        previewContent.copy(
            dueCount = 0,
            nextReview = Instant.parse("2026-11-05T13:30:00Z"),
            news = ReportUiState.ReportNews.None,
        ),
        previewContent.copy(news = previewUnread.copy(close = ReportUiState.CloseRequest.Unreachable)),
        ReportUiState.Loading,
        ReportUiState.Failed,
        ReportUiState.SigningOut,
    )
}

@PreviewMyGame
@Composable
private fun ReportScreenPreview(@PreviewParameter(ReportUiStates::class) state: ReportUiState) {
    MyGamePreviewSurface {
        ReportScreen(
            state = state,
            onIntent = {},
            onNewsOpen = {},
            onSettingsOpen = {},
        )
    }
}

private class ReportLanguages : PreviewParameterProvider<CopyLanguage> {

    override val values: Sequence<CopyLanguage> = sequenceOf(
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English),
        CopyLanguage(ScaffoldLanguage.None, ChromePhase.English),
    )
}

@PreviewMyGame
@Composable
private fun ReportScreenLanguagePreview(@PreviewParameter(ReportLanguages::class) language: CopyLanguage) {
    ProvideCopyLanguage(language = language) {
        MyGamePreviewSurface {
            ReportScreen(
                state = previewContent,
                onIntent = {},
                onNewsOpen = {},
                onSettingsOpen = {},
            )
        }
    }
}
