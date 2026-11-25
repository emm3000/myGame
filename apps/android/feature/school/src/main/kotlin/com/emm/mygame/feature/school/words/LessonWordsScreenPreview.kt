package com.emm.mygame.feature.school.words

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.feature.school.SchoolLanguages
import kotlin.time.Duration.Companion.minutes

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
    isNextStepThisLesson = false,
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
        previewReading.copy(shownSupport = LessonWordsUiState.ShownSupport.Frame(spanIndex = 1)),
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
        LessonWordsScreen(
            state = state,
            onIntent = {},
            onWayOn = {},
            onDone = {},
        )
    }
}

@PreviewMyGame
@Composable
private fun LessonWordsScreenLanguagePreview(
    @PreviewParameter(SchoolLanguages::class) language: CopyLanguage,
) {
    ProvideCopyLanguage(language = language) {
        MyGamePreviewSurface {
            LessonWordsScreen(
                state = previewReading,
                onIntent = {},
                onWayOn = {},
                onDone = {},
            )
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
                onDone = {},
            )
        }
    }
}
