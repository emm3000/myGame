package com.emm.mygame.feature.school

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun SchoolScreen(
    state: SchoolUiState,
    onIntent: (SchoolIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onTextOpen: (TextId) -> Unit,
    modifier: Modifier = Modifier,
    holdoutChecks: @Composable () -> Unit = {},
    placement: @Composable () -> Unit = {},
) {
    val scroll: ScrollState = rememberScrollState()
    val selected: LessonId? = (state as? SchoolUiState.Content)?.selected
    LaunchedEffect(selected) {
        if (selected != null) scroll.animateScrollTo(0)
    }
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(scroll)
            .padding(
                start = MyGameSpacing.step4,
                end = MyGameSpacing.step4,
                top = MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        MyGameSkeleton(
            isLoading = state == SchoolUiState.Loading,
            loadingLabel = chromeResource(R.string.school_loading).spoken,
            blocks = schoolBlocks,
        ) {
            SchoolState(
                state = state,
                onIntent = onIntent,
                onLessonOpen = onLessonOpen,
                onTextOpen = onTextOpen,
                holdoutChecks = holdoutChecks,
                placement = placement,
            )
        }
    }
}

@Composable
private fun SchoolState(
    state: SchoolUiState,
    onIntent: (SchoolIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onTextOpen: (TextId) -> Unit,
    holdoutChecks: @Composable () -> Unit,
    placement: @Composable () -> Unit,
) {
    when (state) {
        SchoolUiState.Loading -> Unit
        SchoolUiState.Failed -> {
            SchoolTitle()
            MyGameErrorBanner(
                message = fixedCopyResource(R.string.school_refusal_unexpected),
                actionLabel = chromeResource(R.string.school_try_again),
                onAction = { onIntent(SchoolIntent.RetryTapped) },
            )
        }
        is SchoolUiState.Content -> SchoolContent(
            content = state,
            onIntent = onIntent,
            onLessonOpen = onLessonOpen,
            onTextOpen = onTextOpen,
            holdoutChecks = holdoutChecks,
            placement = placement,
        )
    }
}

private val schoolBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(
        MyGameSizes.control,
        MyGameSizes.placeCard,
        MyGameSizes.action,
        MyGameSizes.thumbnail,
        MyGameSizes.thumbnail,
    ),
)

@Composable
private fun SchoolContent(
    content: SchoolUiState.Content,
    onIntent: (SchoolIntent) -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onTextOpen: (TextId) -> Unit,
    holdoutChecks: @Composable () -> Unit,
    placement: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shown: SchoolUiState.LessonCard? = content.blockLesson
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        SchoolTitle()
        holdoutChecks()
        LessonSlotSection(
            slot = content.slot,
            stop = content.stop,
            opening = content.learning.opening,
            onIntent = onIntent,
        )
        shown?.let { card: SchoolUiState.LessonCard ->
            ShownLesson(card = card, content = content, onIntent = onIntent, onLessonOpen = onLessonOpen)
        }
        placement()
        LearningSection(learning = content.learning)
        LessonRows(content = content, onIntent = onIntent)
        TextRows(content = content, onTextOpen = onTextOpen)
        BandLines(content = content)
        if (content.isHoldoutNoteShown) HoldoutNote()
        SkillsSection(content = content)
    }
}

@Composable
private fun BandLines(content: SchoolUiState.Content, modifier: Modifier = Modifier) {
    if (content.bandLines.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        content.bandLines.forEach { line: TownSnapshot.BandLine ->
            MyGameText(
                text = fixedCopyResource(
                    R.string.school_band_line,
                    "band" to line.band.number.toString(),
                    "count" to line.count.toString(),
                    "total" to line.total.toString(),
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
        }
    }
}

@Composable
private fun HoldoutNote(modifier: Modifier = Modifier) {
    MyGameText(
        text = fixedCopyResource(R.string.school_holdout_note),
        style = MyGameTypography.body,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier,
    )
}

@Composable
private fun SchoolTitle(modifier: Modifier = Modifier) {
    MyGameText(
        label = chromeResource(R.string.school_title),
        style = MyGameTypography.display,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { heading() },
    )
}
