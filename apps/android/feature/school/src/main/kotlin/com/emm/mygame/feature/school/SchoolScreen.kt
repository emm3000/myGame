package com.emm.mygame.feature.school

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameCard
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSectionTitle
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.designsystem.withTabularFigures
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.rememberPlayerCopy
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

@Composable
fun SchoolScreen(
    state: SchoolUiState,
    onIntent: (SchoolIntent) -> Unit,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onReportOpen: () -> Unit,
    onHoldoutCheckOpen: (PlacementBand, HoldoutCheckWeek) -> Unit,
    modifier: Modifier = Modifier,
    holdoutChecks: @Composable () -> Unit = {},
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
                onReviewsOpen = onReviewsOpen,
                onLessonOpen = onLessonOpen,
                onReportOpen = onReportOpen,
                onHoldoutCheckOpen = onHoldoutCheckOpen,
                holdoutChecks = holdoutChecks,
            )
        }
    }
}

@Composable
private fun SchoolState(
    state: SchoolUiState,
    onIntent: (SchoolIntent) -> Unit,
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onReportOpen: () -> Unit,
    onHoldoutCheckOpen: (PlacementBand, HoldoutCheckWeek) -> Unit,
    holdoutChecks: @Composable () -> Unit,
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
            onReviewsOpen = onReviewsOpen,
            onLessonOpen = onLessonOpen,
            onReportOpen = onReportOpen,
            onHoldoutCheckOpen = onHoldoutCheckOpen,
            holdoutChecks = holdoutChecks,
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
    onReviewsOpen: () -> Unit,
    onLessonOpen: (LessonId) -> Unit,
    onReportOpen: () -> Unit,
    onHoldoutCheckOpen: (PlacementBand, HoldoutCheckWeek) -> Unit,
    holdoutChecks: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    val shown: SchoolUiState.LessonCard? = content.blockLesson
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        SchoolTitle(level = content.schoolLevel)
        holdoutChecks()
        if (shown == null) {
            SchoolNextStep(
                content = content,
                onIntent = onIntent,
                onReviewsOpen = onReviewsOpen,
                onLessonOpen = onLessonOpen,
                onReportOpen = onReportOpen,
                onHoldoutCheckOpen = onHoldoutCheckOpen,
            )
        } else {
            ShownLesson(
                card = shown,
                content = content,
                onIntent = onIntent,
                onLessonOpen = onLessonOpen,
            )
        }
        LearningSection(learning = content.learning)
        shown?.let { card: SchoolUiState.LessonCard ->
            ReviewsLink(
                content = content,
                shown = card.lesson,
                onReviewsOpen = onReviewsOpen,
                onLessonOpen = onLessonOpen,
            )
        }
        LessonRows(content = content, onIntent = onIntent)
        LessonSlotSection(slot = content.slot, stop = content.stop, onIntent = onIntent)
        SkillsSection(content = content)
    }
}

@Composable
private fun SchoolTitle(modifier: Modifier = Modifier, level: Int? = null) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameText(
            label = copy.chrome(R.string.school_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier
                .alignByBaseline()
                .semantics { heading() },
        )
        if (level != null) {
            MyGameText(
                label = copy.chrome(R.string.school_level, "level" to level.toString()),
                style = MyGameTypography.caption.withTabularFigures(),
                color = MyGameTheme.colors.inkMuted,
                modifier = Modifier.alignByBaseline(),
            )
        }
    }
}

@Composable
private fun LearningSection(learning: SchoolUiState.LearningLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameCard(modifier = modifier) {
        Column(
            verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier.padding(vertical = MyGameSpacing.step4),
        ) {
            MyGameText(
                label = copy.chrome(
                    R.string.school_learning,
                    "inLearning" to learning.inLearning.toString(),
                    "cap" to learning.cap.toString(),
                ),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
            MyGameTrack(filled = learning.inLearning.toFloat() / learning.cap, color = MyGameTheme.colors.action)
            learning.wordsPastCap?.let { count: Int ->
                MyGameText(
                    label = copy.chrome(R.string.school_learning_full, "count" to count),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.warningInk,
                )
            }
        }
    }
}

@Composable
private fun SkillsSection(content: SchoolUiState.Content, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameSectionTitle(label = copy.chrome(R.string.school_skills))
        MyGameCard {
            if (content.skills.isEmpty()) {
                MyGameText(
                    label = copy.chrome(R.string.school_skills_none),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.inkMuted,
                    modifier = Modifier.padding(vertical = MyGameSpacing.step4),
                )
            }
            content.skills.forEach { skill: SchoolUiState.SkillLine -> SkillItem(skill = skill) }
        }
    }
}

@Composable
private fun SkillItem(skill: SchoolUiState.SkillLine, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        modifier = modifier.padding(vertical = MyGameSpacing.step3),
    ) {
        MyGameText(
            label = copy.chrome {
                text(
                    R.string.school_skill_name,
                    "resource" to text(resourceNameOf(skill.resource)),
                    "level" to skill.level.toString(),
                )
            },
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            label = copy.chrome {
                text(
                    R.string.school_skill_rate,
                    "percent" to skill.ratePercent.toString(),
                    "resource" to text(resourceNameOf(skill.resource)),
                )
            },
            style = MyGameTypography.caption.withTabularFigures(),
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

private val previewFirstLesson: LessonId = LessonId("lesson-1")

private val previewReleasedLesson: LessonId = LessonId("released-2-1")

private val previewNextReleasedLesson: LessonId = LessonId("released-2-2")

private val previewSecondLesson: LessonId = LessonId("lesson-2")

private val previewOpenLesson: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
    lesson = previewFirstLesson,
    number = 1,
    theme = "A day in town",
    wordCount = 5,
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
    learning = SchoolUiState.LearningLine(inLearning = 3, cap = 10, wordsPastCap = null),
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
    nextStep = NextStepCard(
        line = NextStepCard.Line.Lesson(number = 1),
        detail = NextStepCard.Detail.Words(count = 5),
        countdown = null,
        action = NextStepCard.Action.Study(number = 1),
    ),
    nextStepTime = null,
    start = SchoolUiState.LessonRequest.Idle,
    stop = SchoolUiState.LessonRequest.Idle,
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
            onReviewsOpen = {},
            onLessonOpen = {},
            onReportOpen = {},
            onHoldoutCheckOpen = { _, _ -> },
        )
    }
}

internal class SchoolLanguages : PreviewParameterProvider<CopyLanguage> {

    override val values: Sequence<CopyLanguage> = sequenceOf(
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English),
        CopyLanguage(ScaffoldLanguage.None, ChromePhase.English),
    )
}

private val previewDueCheck: HoldoutCheckRowsUiState =
    HoldoutCheckRowsUiState(listOf(HoldoutCheckRow(PlacementBand.First, HoldoutCheckWeek.Eighth)))

@PreviewMyGame
@Composable
private fun SchoolScreenLanguagePreview(@PreviewParameter(SchoolLanguages::class) language: CopyLanguage) {
    ProvideCopyLanguage(language = language) {
        MyGamePreviewSurface {
            SchoolScreen(
                state = previewReleasedStudied,
                onIntent = {},
                onReviewsOpen = {},
                onLessonOpen = {},
                onReportOpen = {},
                onHoldoutCheckOpen = { _, _ -> },
                holdoutChecks = { HoldoutCheckRows(state = previewDueCheck, onHoldoutCheckOpen = {}) },
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
                onReviewsOpen = {},
                onLessonOpen = {},
                onReportOpen = {},
                onHoldoutCheckOpen = { _, _ -> },
            )
        }
    }
}
