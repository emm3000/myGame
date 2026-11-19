package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import com.emm.mygame.core.network.CaughtUpReason
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class TownDockTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val opened: MutableList<String> = mutableListOf()

    private val sent: MutableList<TownStatusIntent> = mutableListOf()

    private val releasedLesson: LessonId = LessonId("released-2-1")

    private val reviewAt: Instant = Instant.parse("2026-11-18T15:30:00Z")

    private val recordingActions: TownDockActions = TownDockActions(
        onIntent = { intent: TownStatusIntent -> sent.add(intent) },
        onLessonOpen = { lesson: LessonId -> opened.add("lesson ${lesson.value}") },
        onSchoolOpen = { opened.add("school") },
        onReviewsOpen = { opened.add("reviews") },
        onReportOpen = { opened.add("report") },
        onHoldoutCheckOpen = { band: PlacementBand, week: HoldoutCheckWeek ->
            opened.add("check ${band.number} ${week.number}")
        },
    )

    private fun stepOf(
        line: NextStepCard.Line,
        go: TownStatusUiState.Go,
        countdown: TownStatusUiState.StepCountdown? = null,
        lessonStart: TownUiState.LessonStartStatus = TownUiState.LessonStartStatus.Idle,
    ): TownStatusUiState.Dock.Step = TownStatusUiState.Dock.Step(
        line = line,
        detail = null,
        countdown = countdown,
        go = go,
        lessonStart = lessonStart,
        capWait = null,
    )

    private fun show(dock: TownStatusUiState.Dock) {
        composeRule.setContent {
            MyGameTheme {
                TownDock(dock = dock, actions = recordingActions, onFoldChange = {})
            }
        }
    }

    private fun go(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasContentDescription(label, substring = true).and(hasClickAction()))

    private val fullCapStep: TownStatusUiState.Dock.Step = stepOf(
        line = NextStepCard.Line.LearningCap(inLearning = 15, cap = 15),
        go = TownStatusUiState.Go.Acts(NextStepCard.Action.GoToReport, isBusy = false),
        countdown = TownStatusUiState.StepCountdown(
            countdown = NextStepCard.Countdown.NextReview(reviewAt),
            remaining = 12.minutes,
            finishesAt = reviewAt,
        ),
    )

    private fun showInEnglish(content: @Composable () -> Unit) {
        composeRule.setContent {
            ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)) {
                MyGameTheme { content() }
            }
        }
    }

    private val fullCapWithGoal: TownStatusUiState.Dock.Step = fullCapStep.copy(
        detail = TownStatusUiState.StepDetail.Goal(
            TownGoal(
                position = 1,
                count = 9,
                building = TownBuildingKind.Farm,
                level = 1,
                state = TownGoal.State.Underway,
            ),
        ),
    )

    private val isPlaced: SemanticsMatcher = SemanticsMatcher("is placed") { node -> node.layoutInfo.isPlaced }

    private fun placedCount(text: String): Int = composeRule
        .onAllNodes(hasText(text, substring = true) and isPlaced, useUnmergedTree = true)
        .fetchSemanticsNodes()
        .size

    private val releasedStep: TownStatusUiState.Dock.Step = stepOf(
        line = NextStepCard.Line.ReleasedLesson(PlacementBand.Second, number = 1),
        go = TownStatusUiState.Go.Acts(NextStepCard.Action.StudyReleased(releasedLesson), isBusy = false),
    )

    @Test
    @Config(qualifiers = PHONE)
    fun `names the full learning cap in the go button's spoken name`() {
        showInEnglish { TownDock(dock = fullCapStep, actions = recordingActions, onFoldChange = {}) }

        go("Go to the Report").assert(hasContentDescription(FULL_CAP, substring = true))
    }

    @Test
    @Config(qualifiers = PHONE)
    fun `draws no line, no goal and no countdown beside the go button`() {
        showInEnglish { TownDock(dock = fullCapWithGoal, actions = recordingActions, onFoldChange = {}) }

        assertEquals(0, placedCount(FULL_CAP))
        assertEquals(0, placedCount(FARM_GOAL))
        assertEquals(0, placedCount(NEXT_REVIEW))
    }

    @Test
    @Config(qualifiers = PHONE)
    fun `a loading dock draws a busy go button and no skeleton`() {
        show(TownStatusUiState.Dock.Loading)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)

        composeRule
            .onNode(hasClickAction())
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, WAITING))
        val skeletons: Int = composeRule
            .onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true)
            .fetchSemanticsNodes()
            .size
        assertEquals(0, skeletons)
    }

    @Test
    @Config(qualifiers = PHONE)
    fun `a refused status read draws its line as the notice above Try again`() {
        show(TownStatusUiState.Dock.Refused)

        val notice: DpRect = composeRule
            .onNode(hasText(TOWN_UNREACHABLE) and isPlaced, useUnmergedTree = true)
            .getUnclippedBoundsInRoot()
        val tryAgain: DpRect = composeRule.onNode(hasText(TRY_AGAIN) and hasClickAction()).getUnclippedBoundsInRoot()
        assertTrue("the notice sits above $TRY_AGAIN", notice.bottom <= tryAgain.top)
    }

    @Test
    @Config(qualifiers = PHONE)
    fun `no dock and no folded notice draws What is next`() {
        val docks: List<TownStatusUiState.Dock> = listOf(
            TownStatusUiState.Dock.Loading,
            TownStatusUiState.Dock.Refused,
            fullCapWithGoal,
            releasedStep.copy(lessonStart = TownUiState.LessonStartStatus.Unreachable),
        )
        showInEnglish {
            Column {
                docks.forEach { dock: TownStatusUiState.Dock ->
                    TownDock(dock = dock, actions = recordingActions, onFoldChange = {})
                    TownDockNotice(dock = dock)
                }
            }
        }

        assertEquals(0, placedCount(WHAT_IS_NEXT))
        assertEquals(0, placedCount(WHAT_IS_NEXT_IN_SPANISH))
    }

    @Test
    fun `opens the due check by its band and week`() {
        show(
            stepOf(
                line = NextStepCard.Line.HoldoutCheck(PlacementBand.First),
                go = TownStatusUiState.Go.Acts(
                    NextStepCard.Action.OpenHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth),
                    isBusy = false,
                ),
            ),
        )

        go("Abrir la prueba").performClick()

        assertEquals(listOf("check 1 8"), opened)
    }

    @Test
    fun `opens the school from a read-words step that names no lesson`() {
        show(
            stepOf(
                line = NextStepCard.Line.Studying,
                go = TownStatusUiState.Go.Acts(NextStepCard.Action.ReadWords(lesson = null), isBusy = false),
            ),
        )

        go("Leer las palabras").performClick()

        assertEquals(listOf("school"), opened)
    }

    @Test
    fun `starts the released lesson from the go button`() {
        show(releasedStep)

        go("Estudiar las palabras que vuelven").performClick()

        assertEquals(listOf<TownStatusIntent>(TownStatusIntent.ReleasedLessonTapped(releasedLesson)), sent)
    }

    @Test
    fun `draws a refused released lesson start above the go button`() {
        show(
            releasedStep.copy(lessonStart = TownUiState.LessonStartStatus.Refused(TownLessonRefusal.StudySlotBusy)),
        )

        composeRule.onNode(hasText(STUDY_SLOT_BUSY) and isPlaced, useUnmergedTree = true).assertExists()
    }

    private val capRefusal: TownUiState.LessonStartStatus =
        TownUiState.LessonStartStatus.Refused(TownLessonRefusal.LearningCapReached(cap = 15, inLearning = 15))

    private fun refusedOnAFullCap(nextStep: NextStep): TownStatusUiState.Dock.Step =
        townOf(nextStep = nextStep, nextDueAt = readInstant + 1.hours).copy(
            learning = TownSnapshot.Learning(
                cap = 15,
                inLearning = 15,
                retainedWords = null,
                nextInLearningDueAt = readInstant + 3.hours,
            ),
        ).dockOn(TownStatusScreen.ReadsTown, now = readInstant, gap = Duration.ZERO, lessonStart = capRefusal)

    @Test
    fun `refuses past the cap with no review due by naming when the next word in learning is due`() {
        show(refusedOnAFullCap(NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null)))

        composeRule.onNode(
            hasText("Palabras en aprendizaje: 15 de 15. La siguiente se repasa en 3 h · ", substring = true) and
                isPlaced,
            useUnmergedTree = true,
        ).assertExists()
        composeRule.onAllNodes(hasText("Repásalas", substring = true), useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `refuses past the cap with a review due by sending to the reviews`() {
        show(refusedOnAFullCap(NextStep.Reviews(count = 3, readFirst = emptyList())))

        composeRule.onNode(
            hasText("Palabras en aprendizaje: 15 de 15. Repásalas antes de empezar otra lección.") and isPlaced,
            useUnmergedTree = true,
        ).assertExists()
    }

    @Test
    fun `tells when the next review is due on a step that waits`() {
        show(
            stepOf(
                line = NextStepCard.Line.NoReviewsDue,
                go = TownStatusUiState.Go.Blocked(
                    NextStepCard.Action.GoToReport,
                    TownStatusUiState.GoBlock.NextReview,
                ),
                countdown = TownStatusUiState.StepCountdown(
                    countdown = NextStepCard.Countdown.NextReview(reviewAt),
                    remaining = 12.minutes,
                    finishesAt = reviewAt,
                ),
            ),
        )

        go("Ir al informe").assert(stateDescriptionStarting("Siguiente repaso:"))
    }

    @Test
    fun `waits on a study step no screen studies in place`() {
        show(
            stepOf(
                line = NextStepCard.Line.Lesson(number = 2),
                go = TownStatusUiState.Go.ActsInPlace(NextStepCard.Action.Study(number = 2)),
            ),
        )

        go("Estudiar la lección 2").assert(stateDescriptionStarting(WAITING))
    }

    private fun stateDescriptionStarting(words: String): SemanticsMatcher =
        SemanticsMatcher("state description starts with $words") { node ->
            node.config.getOrElseNullable(SemanticsProperties.StateDescription) { null }?.startsWith(words) == true
        }

    private companion object {
        const val WAITING: String = "Esperando"
        const val FULL_CAP: String = "Words in learning: 15 of 15"
        const val FARM_GOAL: String = "Goal 1 of 9: Farm, level 1"
        const val PHONE: String = "+w411dp-h891dp"
        const val REVEAL_MARGIN_MILLIS: Long = 100L
        const val NEXT_REVIEW: String = "Next review"
        const val TOWN_UNREACHABLE: String =
            "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val TRY_AGAIN: String = "Volver a intentarlo"
        const val WHAT_IS_NEXT: String = "What is next"
        const val WHAT_IS_NEXT_IN_SPANISH: String = "Tu siguiente paso"
        const val STUDY_SLOT_BUSY: String = "La escuela ya tiene un estudio en marcha. Espera a que termine."
    }
}
