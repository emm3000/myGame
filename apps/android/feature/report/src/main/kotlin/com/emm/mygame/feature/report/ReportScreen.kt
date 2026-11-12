package com.emm.mygame.feature.report

import android.content.res.Resources
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
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownNews
import com.emm.mygame.core.ui.icuStringResource
import java.time.ZoneId
import kotlin.time.Instant

@Composable
fun ReportScreen(
    state: ReportUiState,
    onIntent: (ReportIntent) -> Unit,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onNewsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
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
            text = stringResource(R.string.report_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == ReportUiState.Loading,
            loadingLabel = stringResource(R.string.report_loading),
            blocks = reportBlocks,
        ) {
            ReportState(
                state = state,
                onIntent = onIntent,
                navigation = ReportScreenLinks(onReviewsOpen, onLessonOpen, onNewsOpen),
            )
        }
        MyGameTextButton(
            label = stringResource(R.string.report_sign_out),
            isBusy = state == ReportUiState.SigningOut,
            busyDescription = stringResource(R.string.report_waiting),
            onClick = { onIntent(ReportIntent.SignOutTapped) },
        )
    }
}

private class ReportScreenLinks(
    val onReviewsOpen: () -> Unit,
    val onLessonOpen: (LessonId) -> Unit,
    val onNewsOpen: () -> Unit,
)

@Composable
private fun ReportState(state: ReportUiState, onIntent: (ReportIntent) -> Unit, navigation: ReportScreenLinks) {
    when (state) {
        ReportUiState.Loading, ReportUiState.SigningOut -> Unit
        ReportUiState.Failed -> MyGameErrorBanner(
            message = stringResource(R.string.report_refusal_unexpected),
            actionLabel = stringResource(R.string.report_try_again),
            onAction = { onIntent(ReportIntent.RetryTapped) },
        )
        is ReportUiState.Content -> {
            ReviewsDueSection(
                content = state,
                onReviewsOpen = navigation.onReviewsOpen,
                onLessonOpen = navigation.onLessonOpen,
            )
            NewsSection(content = state, onIntent = onIntent, onNewsOpen = navigation.onNewsOpen)
        }
    }
}

private val reportBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.thumbnail, MyGameSizes.action, MyGameSizes.thumbnail, MyGameSizes.secondary),
)

@Composable
private fun ReviewsDueSection(
    content: ReportUiState.Content,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    modifier: Modifier = Modifier,
) {
    val dueCount: Int = content.dueCount
    val firstUnread: LessonId? = content.firstUnread
    if (dueCount == 0) {
        NothingDue(nextReview = content.nextReview, receivedAt = content.receivedAt, modifier = modifier)
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameBlock(hue = MyGameBlockHue.Periwinkle) {
            MyGameText(
                text = icuStringResource(R.string.report_reviews_due, "count" to formatQuantity(dueCount.toLong())),
                style = MyGameTypography.display,
                color = MyGameTheme.colors.onBlock,
                modifier = Modifier.semantics { heading() },
            )
        }
        MyGameButton(
            label = stringResource(
                if (firstUnread == null) R.string.report_start_reviews else R.string.report_read_words,
            ),
            isBusy = false,
            busyDescription = stringResource(R.string.report_waiting),
            onClick = { if (firstUnread == null) onReviewsOpen() else onLessonOpen(firstUnread) },
        )
    }
}

@Composable
private fun NothingDue(nextReview: Instant?, receivedAt: Instant, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                text = stringResource(R.string.report_no_reviews_due),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            nextReview?.let { dueAt: Instant ->
                MyGameCountdownLine(
                    words = stringResource(R.string.report_next_review),
                    time = resources.nextReviewLabelOf(dueAt, receivedAt, ZoneId.systemDefault()),
                    ground = MyGameCountdownGround.Paper,
                )
            }
        }
    }
}

@Composable
private fun NewsSection(
    content: ReportUiState.Content,
    onIntent: (ReportIntent) -> Unit,
    onNewsOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameMetaText(
            text = stringResource(R.string.report_news_title),
            color = MyGameTheme.colors.inkMuted,
            modifier = Modifier.semantics { heading() },
        )
        when (val news: ReportUiState.ReportNews = content.news) {
            ReportUiState.ReportNews.None -> NewsNote(line = stringResource(R.string.report_news_none))
            ReportUiState.ReportNews.Closed -> NewsNote(
                line = stringResource(R.string.report_news_closed),
                modifier = Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
            )
            is ReportUiState.ReportNews.Unread ->
                UnreadNews(unread = news, receivedAt = content.receivedAt, onIntent = onIntent)
        }
        MyGameTextLink(label = stringResource(R.string.report_news_all), onClick = onNewsOpen)
    }
}

@Composable
private fun UnreadNews(
    unread: ReportUiState.ReportNews.Unread,
    receivedAt: Instant,
    onIntent: (ReportIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        Column { unread.items.forEach { news: TownNews -> NewsRow(news = news, receivedAt = receivedAt) } }
        if (unread.close == ReportUiState.CloseRequest.Unreachable) {
            MyGameInlineAlert(message = stringResource(R.string.report_refusal_unexpected))
        }
        MyGameOutlinedButton(
            label = stringResource(R.string.report_news_close),
            isBusy = unread.close == ReportUiState.CloseRequest.Waiting,
            busyDescription = stringResource(R.string.report_waiting),
            onClick = { onIntent(ReportIntent.CloseTapped) },
        )
    }
}

private val previewUnread: ReportUiState.ReportNews.Unread = ReportUiState.ReportNews.Unread(
    items = previewTownNews.take(2),
    close = ReportUiState.CloseRequest.Idle,
)

private val previewContent: ReportUiState.Content = ReportUiState.Content(
    dueCount = 3,
    firstUnread = null,
    nextReview = null,
    news = previewUnread,
    receivedAt = previewReceivedAt,
)

private class ReportUiStates : PreviewParameterProvider<ReportUiState> {

    override val values: Sequence<ReportUiState> = sequenceOf(
        previewContent,
        previewContent.copy(firstUnread = LessonId("lesson-2"), news = ReportUiState.ReportNews.Closed),
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
        ReportScreen(state = state, onIntent = {}, onReviewsOpen = {}, onLessonOpen = {}, onNewsOpen = {})
    }
}
