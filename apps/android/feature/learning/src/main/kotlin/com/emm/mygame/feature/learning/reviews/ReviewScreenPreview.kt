package com.emm.mygame.feature.learning.reviews

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.ReviewChoice
import com.emm.mygame.core.model.learning.ReviewHint
import com.emm.mygame.core.model.learning.ReviewHintWord
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.core.ui.TaskDockHook
import kotlin.time.Instant

private val previewRecognition: ReviewUiState.ReviewCard.Recognition = ReviewUiState.ReviewCard.Recognition(
    wordId = WordId("lesson-1-2"),
    word = "school",
    frame = listOf(
        FrameSpan(text = "The ", support = null),
        FrameSpan(text = "kids", support = previewSupport(WordSupport.Shown.Beside, "niños")),
        FrameSpan(text = " ", support = null),
        FrameSpan(text = "walk", support = previewSupport(WordSupport.Shown.OnTap, "caminar")),
        FrameSpan(text = " to school.", support = null),
    ),
    choices = listOf(
        ReviewChoice(id = ChoiceId("0a1b2c3d"), gloss = "dinero"),
        ReviewChoice(id = ChoiceId("4e5f6a7b"), gloss = "escuela"),
        ReviewChoice(id = ChoiceId("8c9d0e1f"), gloss = "granja"),
    ),
    chosen = null,
    openSpan = null,
)

private val previewRecall: ReviewUiState.ReviewCard.Recall = ReviewUiState.ReviewCard.Recall(
    wordId = WordId("lesson-1-1"),
    gloss = "casa",
    gappedFrame = listOf(
        FrameSpan(text = "She ", support = null),
        FrameSpan(text = "goes", support = previewSupport(WordSupport.Shown.OnTap, "ir")),
        FrameSpan(text = " ___ at six.", support = null),
    ),
    typed = "h",
    hint = ReviewHint(words = listOf(ReviewHintWord(firstLetter = "h", letterCount = 4))),
    openSpan = 1,
)

private val previewUnitRecall: ReviewUiState.ReviewCard.Recall = ReviewUiState.ReviewCard.Recall(
    wordId = WordId("lesson-units-1"),
    gloss = "rendirse",
    gappedFrame = listOf(FrameSpan(text = "She will not ____ ____.", support = null)),
    typed = "g",
    hint = ReviewHint(
        words = listOf(
            ReviewHintWord(firstLetter = "g", letterCount = 4),
            ReviewHintWord(firstLetter = "u", letterCount = 2),
        ),
    ),
    openSpan = null,
)

private val previewWithheldRecognition: ReviewUiState.ReviewCard.Recognition = previewRecognition.copy(
    word = "this",
    frame = listOf(
        FrameSpan(text = "Things like this ", support = null),
        FrameSpan(text = "go", support = previewDefinition("to move from one place to another")),
        FrameSpan(text = " on in many ", support = null),
        FrameSpan(text = "towns", support = previewDefinition("a place where people live")),
        FrameSpan(text = ".", support = null),
    ),
    openSpan = 1,
)

private fun previewSupport(shown: WordSupport.Shown, text: String): WordSupport =
    WordSupport(shown = shown, text = text, language = WordSupport.Language.Spanish)

private fun previewDefinition(text: String): WordSupport =
    WordSupport(shown = WordSupport.Shown.OnTap, text = text, language = WordSupport.Language.English)

private val previewReviewing: ReviewUiState.Reviewing = ReviewUiState.Reviewing(
    walked = 1,
    dueCount = 4,
    card = previewRecognition,
    step = ReviewUiState.ReviewStep.Answering,
    isDealtFromStack = false,
)

private class ReviewUiStates : PreviewParameterProvider<ReviewUiState> {

    override val values: Sequence<ReviewUiState> = sequenceOf(
        previewReviewing,
        previewReviewing.copy(card = previewRecognition.copy(openSpan = 3)),
        previewReviewing.copy(card = previewWithheldRecognition),
        previewReviewing.copy(card = previewRecall),
        previewReviewing.copy(card = previewUnitRecall),
        previewReviewing.copy(
            card = previewRecognition.copy(chosen = ChoiceId("4e5f6a7b")),
            step = ReviewUiState.ReviewStep.Correct(
                skill = ReviewUiState.SkillLine(
                    resource = TownResourceKind.Food,
                    level = 2,
                    ratePercent = 10,
                    rates = ReviewUiState.SkillRates(before = 60L, after = 66L),
                    words = listOf("school", "home"),
                ),
                openedLevel = 3,
            ),
        ),
        previewReviewing.copy(
            card = previewRecall.copy(typed = "house", hint = null),
            step = ReviewUiState.ReviewStep.Wrong(correct = "home"),
        ),
        previewReviewing.copy(step = ReviewUiState.ReviewStep.Unreachable),
        ReviewUiState.NothingDue(
            dueAt = Instant.parse("2026-11-05T13:00:00Z"),
            path = ReviewUiState.LessonPath(
                number = 1,
                counts = SchoolPathCounts(held = 5, read = 5, reviewed = 3, learned = 1),
            ),
        ),
        ReviewUiState.LessonReady(lesson = LessonId("lesson-2"), number = 2),
        ReviewUiState.NoCards,
        ReviewUiState.Loading,
        ReviewUiState.Failed,
    )
}

@PreviewMyGame
@Composable
private fun ReviewScreenPreview(@PreviewParameter(ReviewUiStates::class) state: ReviewUiState) {
    MyGamePreviewSurface {
        ReviewScreen(state = state, onIntent = {}, task = TaskDockHook(onAnswered = {}), foldedDock = {})
    }
}

@PreviewMyGame
@Composable
private fun ReviewScreenBothPhasePreview(@PreviewParameter(ReviewUiStates::class) state: ReviewUiState) {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            ReviewScreen(state = state, onIntent = {}, task = TaskDockHook(onAnswered = {}), foldedDock = {})
        }
    }
}
