package com.emm.mygame.feature.report

import android.content.res.Resources
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
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
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
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
            style = MyGameTypography.display,
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
            ReportUiState.SigningOut -> Unit
            is ReportUiState.Content -> {
                ReviewsDueSection(content = state, onReviewsOpen = onReviewsOpen, onLessonOpen = onLessonOpen)
                NewsSection(content = state, onIntent = onIntent)
            }
        }
        MyGameTextButton(
            label = stringResource(R.string.report_sign_out),
            isBusy = state == ReportUiState.SigningOut,
            busyDescription = stringResource(R.string.report_waiting),
            onClick = { onIntent(ReportIntent.SignOutTapped) },
        )
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
        NothingDue(modifier = modifier)
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
private fun NothingDue(modifier: Modifier = Modifier) {
    MyGameCard(modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.report_no_reviews_due),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        )
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
            text = stringResource(R.string.report_news_title),
            color = MyGameTheme.colors.inkMuted,
            modifier = Modifier.semantics { heading() },
        )
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
        Column {
            unread.items.forEach { news: TownNews ->
                MyGameHairline()
                NewsItem(news = news, receivedAt = receivedAt, zone = zone)
            }
        }
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
    Column(modifier = modifier.fillMaxWidth()) {
        MyGameHairline()
        MyGameText(
            text = line,
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.padding(vertical = MyGameSpacing.step3),
        )
    }
}
