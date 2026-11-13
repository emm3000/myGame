package com.emm.mygame.feature.school

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameFrame
import com.emm.mygame.core.designsystem.MyGameFramePiece
import com.emm.mygame.core.designsystem.MyGameFrameText
import com.emm.mygame.core.designsystem.MyGameIcon
import com.emm.mygame.core.designsystem.MyGameIcons
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameSupportLine
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.MyGameWordArt
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.designsystem.blockHueOf
import com.emm.mygame.core.designsystem.dashedFrame
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.designsystem.wordStyle
import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordSupport
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes

internal const val WORD_SILHOUETTE: String = "word_silhouette"

@Composable
fun LessonWordsScreen(
    state: LessonWordsUiState,
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onSchoolOpen: () -> Unit,
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
            LessonWordsState(state = state, onIntent = onIntent, onWayOn = onWayOn, onSchoolOpen = onSchoolOpen)
        }
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
            WordActions(reading = state, onIntent = onIntent, onWayOn = onWayOn, onSchoolOpen = onSchoolOpen)
        }
    }
}

private val lessonWordsBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(MyGameSizes.control, MyGameSizes.placeCard, MyGameSizes.action),
)

@Composable
private fun NothingToRead(onSchoolOpen: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .dashedFrame(MyGameTheme.colors.line)
            .padding(MyGameSpacing.step5),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
            MyGameText(
                label = chromeResource(R.string.school_lesson_nothing_to_read),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            MyGameTextLink(label = chromeResource(R.string.school_go_to_school), onClick = onSchoolOpen)
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
            MyGameText(text = theme, style = MyGameTypography.reading, color = MyGameTheme.colors.ink)
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
            style = MyGameTypography.label,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            label = rememberPlayerCopy().chrome { timeLeftLabelOf(remaining) },
            style = MyGameTypography.heading.withTabularFigures(),
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun WordProgress(reading: LessonWordsUiState.Reading, modifier: Modifier = Modifier) {
    val filled: Float = (reading.index + 1).toFloat() / reading.words.size
    MyGameTrack(
        filled = filled,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
    )
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
        MyGameText(
            label = chromeResource(
                R.string.school_lesson_word_position,
                "number" to (reading.index + 1).toString(),
                "count" to reading.words.size.toString(),
            ),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.onBlockMuted,
        )
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
            openPiece = (reading.shownSupport as? LessonWordsUiState.ShownSupport.Frame)?.span,
            style = MyGameTypography.reading,
            onPieceTap = { span: Int ->
                onIntent(LessonWordsIntent.SupportTapped(LessonWordsUiState.ShownSupport.Frame(span)))
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
    onIntent: (LessonWordsIntent) -> Unit,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    onSchoolOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val wayOn: LessonWordsUiState.WayOn? = reading.wayOn
    val onNextWord: () -> Unit = { onIntent(LessonWordsIntent.NextWordTapped) }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        when {
            wayOn != null -> {
                WayOnButton(wayOn = wayOn, onWayOn = onWayOn)
                if (!reading.isLastWord) NextWordLink(onNextWord = onNextWord)
            }
            !reading.isLastWord -> InkPill(
                label = chromeResource(R.string.school_lesson_word_next),
                onClick = onNextWord,
            )
            else -> ReviewsFollow(onSchoolOpen = onSchoolOpen)
        }
    }
}

@Composable
private fun WayOnButton(
    wayOn: LessonWordsUiState.WayOn,
    onWayOn: (LessonWordsUiState.WayOn) -> Unit,
    modifier: Modifier = Modifier,
) {
    val label: MyGameLabel = when (wayOn) {
        is LessonWordsUiState.WayOn.Lesson -> chromeResource(R.string.school_lesson_next)
        LessonWordsUiState.WayOn.Reviews -> chromeResource(R.string.school_start_reviews)
    }
    InkPill(label = label, onClick = { onWayOn(wayOn) }, modifier = modifier)
}

@Composable
private fun InkPill(label: MyGameLabel, onClick: () -> Unit, modifier: Modifier = Modifier) {
    MyGameButton(
        label = label,
        isBusy = false,
        busyDescription = chromeResource(R.string.school_waiting).spoken,
        onClick = onClick,
        modifier = modifier,
    )
}

@Composable
private fun NextWordLink(onNextWord: () -> Unit, modifier: Modifier = Modifier) {
    MyGameTextLink(
        label = chromeResource(R.string.school_lesson_word_next),
        onClick = onNextWord,
        modifier = modifier,
    )
}

@Composable
private fun ReviewsFollow(onSchoolOpen: () -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = chromeResource(R.string.school_lesson_word_then),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameTextLink(label = chromeResource(R.string.school_go_to_school), onClick = onSchoolOpen)
    }
}

private val previewReading: LessonWordsUiState.Reading = LessonWordsUiState.Reading(
    name = LessonName.Shelved(number = 1),
    theme = "A day in town",
    words = listOf(
        TownSnapshot.WordReading(
            word = "home",
            frame = listOf(
                FrameSpan(text = "This ", support = null),
                FrameSpan(text = "is", support = previewSupport(WordSupport.Shown.OnTap, "es")),
                FrameSpan(text = " my home.", support = null),
            ),
            support = previewSupport(WordSupport.Shown.Beside, "hogar"),
        ),
        TownSnapshot.WordReading(
            word = "water",
            frame = listOf(
                FrameSpan(text = "I ", support = null),
                FrameSpan(text = "drink", support = previewSupport(WordSupport.Shown.Beside, "beber")),
                FrameSpan(text = " water.", support = null),
            ),
            support = previewSupport(WordSupport.Shown.OnTap, "agua"),
        ),
    ),
    index = 0,
    remaining = 3.minutes,
    wayOn = null,
    shownSupport = null,
)

private fun previewSupport(shown: WordSupport.Shown, text: String): WordSupport =
    WordSupport(shown = shown, text = text, language = WordSupport.Language.Spanish)

private val previewDefinition: WordSupport = WordSupport(
    shown = WordSupport.Shown.OnTap,
    text = "clear liquid that people drink",
    language = WordSupport.Language.English,
)

private class LessonWordsUiStates : PreviewParameterProvider<LessonWordsUiState> {

    override val values: Sequence<LessonWordsUiState> = sequenceOf(
        previewReading,
        previewReading.copy(index = 1, remaining = null, wayOn = LessonWordsUiState.WayOn.Reviews),
        previewReading.copy(index = 1, shownSupport = LessonWordsUiState.ShownSupport.Word),
        previewReading.copy(shownSupport = LessonWordsUiState.ShownSupport.Frame(span = 1)),
        previewReading.copy(
            words = previewReading.words.map { word: TownSnapshot.WordReading ->
                word.copy(support = previewDefinition)
            },
            shownSupport = LessonWordsUiState.ShownSupport.Word,
        ),
        previewReading.copy(name = LessonName.Released(PlacementBand.Second, set = 1), theme = null),
        LessonWordsUiState.NothingToRead,
        LessonWordsUiState.Loading,
        LessonWordsUiState.Failed,
    )
}

@PreviewMyGame
@Composable
private fun LessonWordsScreenPreview(@PreviewParameter(LessonWordsUiStates::class) state: LessonWordsUiState) {
    MyGamePreviewSurface {
        LessonWordsScreen(state = state, onIntent = {}, onWayOn = {}, onSchoolOpen = {})
    }
}

@PreviewMyGame
@Composable
private fun LessonWordsScreenLanguagePreview(
    @PreviewParameter(SchoolLanguages::class) language: CopyLanguage,
) {
    ProvideCopyLanguage(language = language) {
        MyGamePreviewSurface {
            LessonWordsScreen(state = previewReading, onIntent = {}, onWayOn = {}, onSchoolOpen = {})
        }
    }
}

@PreviewMyGame
@Composable
private fun LessonWordsScreenReleasedBothPreview() {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            LessonWordsScreen(
                state = previewReading.copy(name = LessonName.Released(PlacementBand.Second, set = 1), theme = null),
                onIntent = {},
                onWayOn = {},
                onSchoolOpen = {},
            )
        }
    }
}
