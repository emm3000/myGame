package com.emm.mygame.feature.report

import android.content.res.Resources
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.dashedFrame
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
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        when (state) {
            ReportUiState.Loading -> MyGameText(
                text = stringResource(R.string.report_loading),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
            ReportUiState.Failed -> MyGameErrorBanner(
                message = stringResource(R.string.report_refusal_unexpected),
                actionLabel = stringResource(R.string.report_try_again),
                onAction = { onIntent(ReportIntent.RetryTapped) },
            )
            is ReportUiState.Content -> {
                ReviewsDueSection(content = state, onReviewsOpen = onReviewsOpen, onLessonOpen = onLessonOpen)
                NewsSection(content = state, onIntent = onIntent)
            }
        }
    }
}

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
        EmptyLine(line = stringResource(R.string.report_no_reviews_due), modifier = modifier)
        return
    }
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                text = icuStringResource(R.string.report_reviews_due, "count" to formatQuantity(dueCount.toLong())),
                style = MyGameTypography.heading,
                color = MyGameTheme.colors.ink,
            )
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
}

@Composable
private fun NewsSection(
    content: ReportUiState.Content,
    onIntent: (ReportIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(text = stringResource(R.string.report_news_title))
        when (val news: ReportUiState.ReportNews = content.news) {
            ReportUiState.ReportNews.None -> EmptyLine(line = stringResource(R.string.report_news_none))
            ReportUiState.ReportNews.Closed -> EmptyLine(
                line = stringResource(R.string.report_news_closed),
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
    val zone: ZoneId = ZoneId.systemDefault()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameCard {
            unread.items.forEach { news: TownNews -> NewsItem(news = news, receivedAt = receivedAt, zone = zone) }
        }
        if (unread.close == ReportUiState.CloseRequest.Unreachable) {
            MyGameInlineAlert(message = stringResource(R.string.report_refusal_unexpected))
        }
        MyGameButton(
            label = stringResource(R.string.report_news_close),
            isBusy = unread.close == ReportUiState.CloseRequest.Waiting,
            busyDescription = stringResource(R.string.report_waiting),
            onClick = { onIntent(ReportIntent.CloseTapped) },
        )
    }
}

@Composable
private fun NewsItem(news: TownNews, receivedAt: Instant, zone: ZoneId, modifier: Modifier = Modifier) {
    val resources: Resources = LocalResources.current
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.padding(vertical = MyGameSpacing.step3),
    ) {
        MyGameText(
            text = resources.instantLabelOf(news.occurredAt, receivedAt, zone),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(text = resources.newsLineOf(news), style = MyGameTypography.body, color = MyGameTheme.colors.ink)
        resources.payLineOf(news)?.let { pay: String ->
            MyGameText(text = pay, style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted)
        }
    }
}

@Composable
private fun EmptyLine(line: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .dashedFrame(MyGameTheme.colors.line)
            .padding(MyGameSpacing.step5),
    ) {
        MyGameText(text = line, style = MyGameTypography.body, color = MyGameTheme.colors.ink)
    }
}
