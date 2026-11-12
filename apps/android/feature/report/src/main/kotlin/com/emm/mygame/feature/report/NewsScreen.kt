package com.emm.mygame.feature.report

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.TownNews

@Composable
fun NewsScreen(state: NewsUiState, onIntent: (NewsIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(
                start = MyGameSpacing.step4,
                end = MyGameSpacing.step4,
                top = MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        MyGameText(
            text = stringResource(R.string.report_news_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == NewsUiState.Loading,
            loadingLabel = stringResource(R.string.report_news_loading),
            blocks = newsBlocks,
        ) {
            NewsState(state = state, onIntent = onIntent)
        }
    }
}

@Composable
private fun NewsState(state: NewsUiState, onIntent: (NewsIntent) -> Unit) {
    when (state) {
        NewsUiState.Loading -> Unit
        NewsUiState.Failed -> MyGameErrorBanner(
            message = stringResource(R.string.report_refusal_unexpected),
            actionLabel = stringResource(R.string.report_try_again),
            onAction = { onIntent(NewsIntent.RetryTapped) },
        )
        is NewsUiState.Content ->
            if (state.news.isEmpty()) {
                NewsNote(line = stringResource(R.string.report_news_none))
            } else {
                Column { state.news.forEach { news: TownNews -> NewsRow(news = news, receivedAt = state.receivedAt) } }
            }
    }
}

private val newsBlocks: MyGameSkeletonBlocks =
    MyGameSkeletonBlocks(listOf(MyGameSizes.control, MyGameSizes.control, MyGameSizes.control))

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
