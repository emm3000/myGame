package com.emm.mygame.feature.today

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
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTitleLine
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.fixedLabel
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun TodayScreen(
    state: TodayUiState,
    onIntent: (TodayIntent) -> Unit,
    navigation: TodayNavigation,
    modifier: Modifier = Modifier,
    ring: @Composable () -> Unit = {},
    placement: @Composable () -> Unit = {},
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
                top = MyGameSpacing.step4,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        MyGameHeader(end = ring) {
            MyGameText(
                label = chromeResource(R.string.today_title),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
        }
        MyGameSkeleton(
            isLoading = state == TodayUiState.Loading,
            loadingLabel = chromeResource(R.string.today_loading).spoken,
            blocks = todayBlocks,
        ) {
            TodayState(state = state, onIntent = onIntent, navigation = navigation, placement = placement)
        }
    }
}

@Composable
private fun TodayState(
    state: TodayUiState,
    onIntent: (TodayIntent) -> Unit,
    navigation: TodayNavigation,
    placement: @Composable () -> Unit,
) {
    when (state) {
        TodayUiState.Loading -> Unit
        TodayUiState.Failed -> MyGameErrorBanner(
            message = fixedCopyResource(R.string.today_refusal_unexpected),
            actionLabel = chromeResource(R.string.today_try_again),
            onAction = { onIntent(TodayIntent.RetryTapped) },
        )
        is TodayUiState.Content ->
            TodayContent(content = state, onIntent = onIntent, navigation = navigation, placement = placement)
    }
}

@Composable
private fun TodayContent(
    content: TodayUiState.Content,
    onIntent: (TodayIntent) -> Unit,
    navigation: TodayNavigation,
    placement: @Composable () -> Unit,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6)) {
        content.first?.let { card: TodayUiState.FirstCard ->
            TodayFirstCard(
                card = card,
                eyebrow = copy.eyebrowOf(content.eyebrow),
                start = content.start,
                onAct = { onIntent.actOn(card, navigation) },
            )
        }
        if (content.hasInProgress()) InProgress(content = content, copy = copy, navigation = navigation)
        TodayCanDo(content = content, onIntent = onIntent, placement = placement)
        if (content.locked.isNotEmpty()) TodayLocked(content = content, onIntent = onIntent)
    }
}

@Composable
private fun InProgress(content: TodayUiState.Content, copy: PlayerCopy, navigation: TodayNavigation) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
        MyGameSectionTitle(label = fixedLabel(copy.fixedCopy(R.string.today_in_progress)))
        content.lesson?.let { running: TodayUiState.RunningLesson ->
            MyGameNavRow(
                title = copy.runningTitleOf(running.name),
                status = copy.runningTimeOf(running),
                onClick = { navigation.onLessonOpen(running.lesson) },
            )
        }
        content.work?.let { work: TodayUiState.RunningWork ->
            WorkRow(title = copy.workTitleOf(work), status = copy.workTimeOf(work))
        }
        content.job?.let { job: TodayUiState.JobOut ->
            MyGameNavRow(title = copy.jobTitleOf(job), status = copy.jobTimeOf(job), onClick = navigation.onMapOpen)
        }
    }
}

@Composable
private fun WorkRow(title: MyGameLabel, status: MyGameLabel) {
    Column(modifier = Modifier.fillMaxWidth()) {
        MyGameTitleLine(
            title = title,
            status = status,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = MyGameSpacing.step2, vertical = MyGameSpacing.step3),
        )
        MyGameHairline()
    }
}

private fun TodayUiState.Content.hasInProgress(): Boolean = lesson != null || work != null || job != null

private fun ((TodayIntent) -> Unit).actOn(card: TodayUiState.FirstCard, navigation: TodayNavigation) {
    when (card) {
        is TodayUiState.FirstCard.Study -> invoke(TodayIntent.StudyTapped(card.lesson))
        is TodayUiState.FirstCard.StudyReleased -> invoke(TodayIntent.StudyTapped(card.lesson))
        is TodayUiState.FirstCard.Reviews -> card.readFirst?.let(navigation.onLessonOpen) ?: navigation.onReviewsOpen()
        is TodayUiState.FirstCard.HoldoutCheck -> navigation.onHoldoutCheckOpen(card.band, card.week)
        is TodayUiState.FirstCard.CaughtUp -> Unit
    }
}

private val todayBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.placeCard, MyGameSizes.action, MyGameSizes.control, MyGameSizes.control),
)
