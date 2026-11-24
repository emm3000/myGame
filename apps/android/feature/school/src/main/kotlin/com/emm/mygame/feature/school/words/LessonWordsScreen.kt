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
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameFrame
import com.emm.mygame.core.designsystem.MyGameFramePiece
import com.emm.mygame.core.designsystem.MyGameFrameText
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameSupportLine
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.MyGameWordArt
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.designsystem.englishTextOf
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.designsystem.wordStyle
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.ui.FoldedTaskEnd
import com.emm.mygame.core.ui.TaskDockHook
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.core.ui.timeLeftLabelOf
import com.emm.mygame.feature.school.R
import com.emm.mygame.feature.school.lessonTitleOf
import com.emm.mygame.feature.school.schoolDurationCopy
import com.emm.mygame.feature.school.toMyGameFrame
import com.emm.mygame.feature.school.toMyGameSupport
import kotlin.time.Duration

internal const val WORD_SILHOUETTE: String = "word_silhouette"

@Composable
internal fun LessonWordsScreen(
    state: LessonWordsUiState,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onSchoolOpen: () -> Unit,
    task: TaskDockHook,
    foldedDock: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    LessonWordsDock(state = state, onIntent = onIntent, onWayOn = onWayOn, task = task)
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
            LessonWordsState(state = state, onIntent = onIntent, onWayOn = onWayOn, onSchoolOpen = onSchoolOpen)
        }
        FoldedTaskEnd(
            hook = task,
            foldedDock = foldedDock,
            shownNotice = null,
        )
    }
}

@Composable
private fun LessonWordsState(
    state: LessonWordsUiState,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onSchoolOpen: () -> Unit,
) {
    when (state) {
        LessonWordsUiState.Loading -> Unit
        LessonWordsUiState.Failed -> MyGameErrorBanner(
            message = fixedCopyResource(R.string.school_refusal_unexpected),
            actionLabel = chromeResource(R.string.school_try_again),
            onAction = { onIntent(LessonWordsIntent.RetryTapped) },
        )
        LessonWordsUiState.NothingToRead -> NothingToRead(onSchoolOpen = onSchoolOpen)
        is LessonWordsUiState.Reading -> {
            LessonHeader(reading = state)
            state.remaining?.let { remaining: Duration -> RunningTime(remaining = remaining) }
            WordProgress(reading = state)
            WordBlock(reading = state, onIntent = onIntent)
            WordActions(reading = state, onWayOn = onWayOn, onSchoolOpen = onSchoolOpen)
        }
    }
}

private val lessonWordsBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.control, MyGameSizes.placeCard, MyGameSizes.action),
)

@Composable
private fun NothingToRead(onSchoolOpen: () -> Unit, modifier: Modifier = Modifier) {
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                label = chromeResource(R.string.school_lesson_nothing_to_read),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            MyGameNavRow(title = chromeResource(R.string.school_go_to_school), onClick = onSchoolOpen)
        }
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
        MyGameIcon(icon = MyGameIcons.hourglass, tint = MyGameTheme.colors.inkMuted)
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

@Composable
private fun WordProgress(reading: LessonWordsUiState.Reading, modifier: Modifier = Modifier) {
    val filled: Float = (reading.index + 1).toFloat() / reading.words.size
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = chromeResource(
                R.string.school_lesson_word_position,
                "number" to (reading.index + 1).toString(),
                "count" to reading.words.size.toString(),
            ),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameTrack(
            filled = filled,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
        )
    }
}

@Composable
private fun WordBlock(
    reading: LessonWordsUiState.Reading,
    onIntent: (LessonWordsIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val word: TownSnapshot.WordReading = reading.word
    MyGameBlock(
        hue = blockHueOf(reading.index),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        wordArtOf(word.word)?.let { art: MyGameArt ->
            MyGameWordArt(art = art, modifier = Modifier.semantics { testTag = WORD_SILHOUETTE })
        }
        WordHeading(
            word = word,
            isOpen = reading.shownSupport == LessonWordsUiState.ShownSupport.Word,
            onIntent = onIntent,
        )
        MyGameFrameText(
            frame = word.frame.toMyGameFrame(),
            openPiece = (reading.shownSupport as? LessonWordsUiState.ShownSupport.Frame)?.spanIndex,
            style = MyGameTypography.reading,
            onPieceTap = { spanIndex: Int ->
                onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Frame(spanIndex)))
            },
        )
        reading.openSupport?.let { support: WordSupport -> MyGameSupportLine(support = support.toMyGameSupport()) }
    }
}

@Composable
private fun WordHeading(
    word: TownSnapshot.WordReading,
    isOpen: Boolean,
    onIntent: (LessonWordsIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    MyGameFrameText(
        frame = MyGameFrame(listOf(MyGameFramePiece(text = word.word, support = word.support?.toMyGameSupport()))),
        openPiece = if (isOpen) 0 else null,
        style = wordStyle(),
        onPieceTap = { onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Word)) },
        modifier = modifier.semantics { heading() },
    )
}

@Composable
private fun WordActions(
    reading: LessonWordsUiState.Reading,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val wayOn: LessonWordsUiState.WayOn? = reading.wayOn
    when {
        !reading.isLastWord -> wayOn?.let { shown: LessonWordsUiState.WayOn ->
            MyGameNavRow(title = wayOnLabelOf(shown), onClick = { onWayOn(shown) }, modifier = modifier)
        }
        wayOn != null -> Unit
        else -> ReviewsFollow(onSchoolOpen = onSchoolOpen, modifier = modifier)
    }
}

@Composable
private fun ReviewsFollow(onSchoolOpen: () -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.school_lesson_word_then),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameNavRow(title = chromeResource(R.string.school_go_to_school), onClick = onSchoolOpen)
    }
}
