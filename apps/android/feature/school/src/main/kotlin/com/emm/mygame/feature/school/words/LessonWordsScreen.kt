package com.emm.mygame.feature.school.words

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.control.MyGameErrorBanner
import com.emm.mygame.core.designsystem.control.MyGameWorkingDots
import com.emm.mygame.core.designsystem.frame.MyGameCard
import com.emm.mygame.core.designsystem.frame.MyGameSkeleton
import com.emm.mygame.core.designsystem.frame.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.englishTextOf
import com.emm.mygame.core.designsystem.text.withTabularFigures
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.core.ui.timeLeftLabelOf
import com.emm.mygame.feature.school.R
import com.emm.mygame.feature.school.lessonTitleOf
import com.emm.mygame.feature.school.schoolDurationCopy
import kotlin.time.Duration

@Composable
internal fun LessonWordsScreen(
    state: LessonWordsUiState,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = MyGameSpacing.step5, vertical = MyGameSpacing.step8),
    ) {
        MyGameSkeleton(
            isLoading = state == LessonWordsUiState.Loading,
            loadingLabel = chromeResource(R.string.school_loading).spoken,
            blocks = lessonWordsBlocks,
        ) {
            LessonWordsState(state = state, onIntent = onIntent, onWayOn = onWayOn)
        }
        LessonWordsWayOn(state = state, onIntent = onIntent, onWayOn = onWayOn, onDone = onDone)
    }
}

@Composable
private fun LessonWordsState(
    state: LessonWordsUiState,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
) {
    when (state) {
        LessonWordsUiState.Loading -> Unit
        LessonWordsUiState.Failed -> MyGameErrorBanner(
            message = fixedCopyResource(R.string.school_refusal_unexpected),
            actionLabel = chromeResource(R.string.school_try_again),
            onAction = { onIntent(LessonWordsIntent.RetryTapped) },
        )
        is LessonWordsUiState.NothingToRead -> NothingToRead()
        is LessonWordsUiState.Reading -> {
            LessonHeader(reading = state)
            state.remaining?.let { remaining: Duration -> RunningTime(remaining = remaining) }
            WordProgress(reading = state)
            ReadingWordBlock(reading = state, onIntent = onIntent)
            WordActions(reading = state, onWayOn = onWayOn)
        }
    }
}

private val lessonWordsBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.control, MyGameSizes.placeCard, MyGameSizes.action),
)

@Composable
private fun NothingToRead(modifier: Modifier = Modifier) {
    MyGameCard(modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.school_lesson_nothing_to_read),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        )
    }
}

@Composable
private fun LessonHeader(reading: LessonWordsUiState.Reading, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            label = rememberPlayerCopy().lessonTitleOf(reading.name),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        reading.theme?.let { theme: String ->
            MyGameText(text = englishTextOf(theme), style = MyGameTypography.reading, color = MyGameTheme.colors.ink)
        }
    }
}

@Composable
private fun RunningTime(remaining: Duration, modifier: Modifier = Modifier) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier.semantics(mergeDescendants = true) {},
    ) {
        MyGameWorkingDots(tint = MyGameTheme.colors.inkMuted)
        MyGameText(
            label = chromeResource(R.string.school_slot_title),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            label = rememberPlayerCopy().chrome { timeLeftLabelOf(remaining, schoolDurationCopy) },
            style = MyGameTypography.heading.withTabularFigures(),
            color = MyGameTheme.colors.ink,
        )
    }
}
