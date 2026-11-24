package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

private val previewFirstLesson: LessonId = LessonId("lesson-1")

private val previewReleasedLesson: LessonId = LessonId("released-2-1")

private val previewNextReleasedLesson: LessonId = LessonId("released-2-2")

private val previewSecondLesson: LessonId = LessonId("lesson-2")

private val previewOpenLesson: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
    lesson = previewFirstLesson,
    number = 1,
    theme = "A day in town",
    wordCount = 5,
    enteringWordCount = 5,
    resource = TownResourceKind.Food,
    ratePercent = 5,
    duration = 150.seconds,
    path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
    state = SchoolUiState.LessonState.Open(block = null),
)

private val previewBlockedLesson: SchoolUiState.LessonCard = previewOpenLesson.copy(
    lesson = previewSecondLesson,
    number = 2,
    theme = "Work and money",
    resource = TownResourceKind.Money,
    state = SchoolUiState.LessonState.Open(block = SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2)),
)

private val previewReleasedOpen: SchoolUiState.ReleasedLessonCard = SchoolUiState.ReleasedLessonCard(
    lesson = previewReleasedLesson,
    name = LessonName.Released(PlacementBand.Second, set = 1),
    wordCount = 5,
    duration = 150.seconds,
    path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
    state = SchoolUiState.LessonState.Open(block = null),
)

private val previewReleasedNext: SchoolUiState.ReleasedLessonCard = previewReleasedOpen.copy(
    lesson = previewNextReleasedLesson,
    name = LessonName.Released(PlacementBand.Second, set = 2),
)

private val previewContent: SchoolUiState.Content = SchoolUiState.Content(
    schoolLevel = 1,
    learning = SchoolUiState.LearningLine(
        inLearning = 3,
        cap = 10,
        pastCapWords = null,
        opening = SchoolUiState.CapOpening.ReviewsDue,
    ),
    slot = SchoolUiState.SlotLine.Idle,
    skills = listOf(
        SchoolUiState.SkillLine(
            lesson = previewFirstLesson,
            resource = TownResourceKind.Food,
            level = 1,
            ratePercent = 5,
        ),
    ),
    lessons = listOf(previewOpenLesson, previewBlockedLesson),
    releasedLessons = listOf(previewReleasedOpen, previewReleasedNext),
    texts = listOf(SchoolUiState.TextCard(text = TextId("text-1"), title = "A New Course")),
    studyMark = SchoolUiState.DurationMark(SeasonKind.Winter, percent = 75),
    nextStep = NextStepCard(
        line = NextStepCard.Line.Lesson(number = 1),
        detail = NextStepCard.Detail.Words(count = 5),
        countdown = null,
        action = NextStepCard.Action.Study(number = 1),
    ),
    start = SchoolUiState.LessonRequest.Idle,
    stop = SchoolUiState.LessonRequest.Idle,
    isHoldoutNoteShown = true,
    bandLines = listOf(TownSnapshot.BandLine(PlacementBand.First, count = 12, total = 875)),
)

private val previewStudying: SchoolUiState.Content = previewContent.copy(
    slot = SchoolUiState.SlotLine.Busy(
        lesson = previewFirstLesson,
        name = LessonName.Shelved(number = 1),
        remaining = 2.minutes,
        total = 150.seconds,
    ),
    lessons = listOf(previewOpenLesson.copy(state = SchoolUiState.LessonState.Studying), previewBlockedLesson),
    nextStep = NextStepCard(
        line = NextStepCard.Line.Studying,
        detail = null,
        countdown = null,
        action = NextStepCard.Action.ReadWords(lesson = previewFirstLesson),
    ),
)

private val previewReleasedStudying: SchoolUiState.Content = previewContent.copy(
    slot = SchoolUiState.SlotLine.Busy(
        lesson = previewReleasedLesson,
        name = previewReleasedOpen.name,
        remaining = 2.minutes,
        total = 150.seconds,
    ),
    lessons = listOf(
        previewOpenLesson.copy(
            state = SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SlotBusy(previewReleasedOpen.name)),
        ),
        previewBlockedLesson,
    ),
    releasedLessons = listOf(
        previewReleasedOpen.copy(state = SchoolUiState.LessonState.Studying),
        previewReleasedNext.copy(
            state = SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SlotBusy(previewReleasedOpen.name)),
        ),
    ),
    nextStep = NextStepCard(
        line = NextStepCard.Line.Studying,
        detail = null,
        countdown = null,
        action = NextStepCard.Action.ReadWords(lesson = previewReleasedLesson),
    ),
)

private val previewReleasedStudied: SchoolUiState.Content = previewContent.copy(
    releasedLessons = listOf(
        previewReleasedOpen.copy(
            path = SchoolPathCounts(held = 5, read = 5, reviewed = 2, learned = 0),
            state = SchoolUiState.LessonState.Studied,
        ),
        previewReleasedNext,
    ),
)

private class SchoolUiStates : PreviewParameterProvider<SchoolUiState> {

    override val values: Sequence<SchoolUiState> = sequenceOf(
        previewContent,
        previewContent.copy(studyMark = SchoolUiState.DurationMark(SeasonKind.Summer, percent = 125)),
        previewStudying,
        previewReleasedStudying,
        previewReleasedStudied,
        previewContent.copy(
            start = SchoolUiState.LessonRequest.Refused(previewNextReleasedLesson, TownLessonRefusal.StudySlotBusy),
        ),
        previewContent.copy(lessons = emptyList(), releasedLessons = emptyList(), skills = emptyList()),
        previewContent.copy(
            start = SchoolUiState.LessonRequest.Refused(previewFirstLesson, TownLessonRefusal.StudySlotBusy),
        ),
        previewContent.copy(start = SchoolUiState.LessonRequest.Unreachable(previewFirstLesson)),
        previewContent.copy(
            nextStep = NextStepCard(
                line = NextStepCard.Line.HoldoutCheck(PlacementBand.First),
                detail = null,
                countdown = null,
                action = NextStepCard.Action.OpenHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth),
            ),
        ),
        previewContent.copy(
            nextStep = NextStepCard(
                line = NextStepCard.Line.ReleasedLesson(PlacementBand.Second, number = 1),
                detail = null,
                countdown = null,
                action = NextStepCard.Action.StudyReleased(previewReleasedLesson),
            ),
            start = SchoolUiState.LessonRequest.Refused(previewReleasedLesson, TownLessonRefusal.StudySlotBusy),
        ),
        SchoolUiState.Loading,
        SchoolUiState.Failed,
    )
}

@PreviewMyGame
@Composable
private fun SchoolScreenPreview(@PreviewParameter(SchoolUiStates::class) state: SchoolUiState) {
    MyGamePreviewSurface {
        SchoolScreen(
            state = state,
            onIntent = {},
            onLessonOpen = {},
            onTextOpen = {},
        )
    }
}

@Composable
private fun PreviewHoldoutChecksSlot() {
    MyGameText(
        text = "Holdout checks slot",
        style = MyGameTypography.body,
        color = MyGameTheme.colors.ink,
    )
}

@PreviewMyGame
@Composable
private fun SchoolScreenLanguagePreview(@PreviewParameter(SchoolLanguages::class) language: CopyLanguage) {
    ProvideCopyLanguage(language = language) {
        MyGamePreviewSurface {
            SchoolScreen(
                state = previewReleasedStudied,
                onIntent = {},
                onLessonOpen = {},
                onTextOpen = {},
                holdoutChecks = { PreviewHoldoutChecksSlot() },
            )
        }
    }
}

@PreviewMyGame
@Composable
private fun SchoolScreenStudyingBothPreview() {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            SchoolScreen(
                state = previewStudying,
                onIntent = {},
                onLessonOpen = {},
                onTextOpen = {},
            )
        }
    }
}
