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
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameCountdownGround
import com.emm.mygame.core.designsystem.MyGameCountdownLine
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.formatQuantity
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.joinsFrameTraversal
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.report.news.NewsNote
import com.emm.mygame.feature.report.news.NewsRow
import java.time.ZoneId
import kotlin.time.Instant

@Composable
internal fun ReportScreen(
    state: ReportUiState,
    onIntent: (ReportIntent) -> Unit,
    onNewsOpen: () -> Unit,
    onSettingsOpen: () -> Unit,
    modifier: Modifier = Modifier,
    foldedDock: @Composable () -> Unit = {},
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .joinsFrameTraversal()
            .verticalScroll(rememberScrollState())
            .padding(
                start = MyGameSpacing.step4,
                end = MyGameSpacing.step4,
                top = MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        foldedDock()
        MyGameText(
            label = chromeResource(R.string.report_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == ReportUiState.Loading,
            loadingLabel = chromeResource(R.string.report_loading).spoken,
            blocks = reportBlocks,
        ) {
            ReportState(state = state, onIntent = onIntent)
        }
        if (state != ReportUiState.SigningOut) {
            ReportRows(
                isReminderOffered = isReminderOffered(state),
                onNewsOpen = onNewsOpen,
                onSettingsOpen = onSettingsOpen,
            )
        }
        MyGameTextLink(
            label = fixedCopyResource(R.string.report_sign_out),
            isBusy = state == ReportUiState.SigningOut,
            busyDescription = chromeResource(R.string.report_waiting).spoken,
            onClick = { onIntent(ReportIntent.SignOutTapped) },
        )
    }
}

private fun isReminderOffered(state: ReportUiState): Boolean =
    state is ReportUiState.Content && state.dueCount == 0 && !state.isReminderOn

@Composable
private fun ReportState(state: ReportUiState, onIntent: (ReportIntent) -> Unit) {
    when (state) {
        ReportUiState.Loading, ReportUiState.SigningOut -> Unit
        ReportUiState.Failed -> MyGameErrorBanner(
            message = fixedCopyResource(R.string.report_refusal_unexpected),
            actionLabel = chromeResource(R.string.report_try_again),
            onAction = { onIntent(ReportIntent.RetryTapped) },
        )
        is ReportUiState.Content -> {
            ReviewsDueSection(content = state)
            NewsSection(content = state, onIntent = onIntent)
        }
    }
}

private val reportBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.thumbnail, MyGameSizes.action, MyGameSizes.thumbnail, MyGameSizes.secondary),
)

@Composable
private fun ReviewsDueSection(
    content: ReportUiState.Content,
    modifier: Modifier = Modifier,
) {
    val dueCount: Int = content.dueCount
    if (dueCount == 0) {
        NothingDue(content = content, modifier = modifier)
        return
    }
    MyGameBlock(hue = MyGameBlockHue.Periwinkle, modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.report_reviews_due, "count" to formatQuantity(dueCount.toLong())),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.onBlock,
            modifier = Modifier.semantics { heading() },
        )
    }
}

@Composable
private fun NothingDue(content: ReportUiState.Content, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val receivedAt: Instant = content.receivedAt
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                label = chromeResource(R.string.report_no_reviews_due),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            content.nextReview?.let { dueAt: Instant ->
                MyGameCountdownLine(
                    words = chromeResource(R.string.report_next_review),
                    time = copy.chrome { nextReviewLabelOf(dueAt, receivedAt, ZoneId.systemDefault()) },
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
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameMetaText(
            label = chromeResource(R.string.report_news_title),
            color = MyGameTheme.colors.inkMuted,
            modifier = Modifier.semantics { heading() },
        )
        when (val news: ReportUiState.ReportNews = content.news) {
            ReportUiState.ReportNews.None -> NewsNote(line = chromeResource(R.string.report_news_none))
            ReportUiState.ReportNews.Closed -> NewsNote(
                line = chromeResource(R.string.report_news_closed),
                modifier = Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
            )
            is ReportUiState.ReportNews.Unread ->
                UnreadNews(unread = news, receivedAt = content.receivedAt, onIntent = onIntent)
        }
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
            MyGameInlineAlert(message = fixedCopyResource(R.string.report_refusal_unexpected))
        }
        MyGameOutlinedButton(
            label = chromeResource(R.string.report_news_close),
            isBusy = unread.close == ReportUiState.CloseRequest.Waiting,
            busyDescription = chromeResource(R.string.report_waiting).spoken,
            onClick = { onIntent(ReportIntent.CloseTapped) },
        )
    }
}
