package com.emm.mygame.feature.report.news

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame

private class NewsUiStates : PreviewParameterProvider<NewsUiState> {

    override val values: Sequence<NewsUiState> = sequenceOf(
        NewsUiState.Content(news = previewTownNews, receivedAt = previewReceivedAt),
        NewsUiState.Content(news = emptyList(), receivedAt = previewReceivedAt),
        NewsUiState.Loading,
        NewsUiState.Failed,
    )
}

@PreviewMyGame
@Composable
private fun NewsScreenPreview(@PreviewParameter(NewsUiStates::class) state: NewsUiState) {
    MyGamePreviewSurface {
        NewsScreen(state = state, onIntent = {})
    }
}
