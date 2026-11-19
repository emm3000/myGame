package com.emm.mygame.feature.town

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
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
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

    private fun placedBoundsOf(text: String): DpRect =
        composeRule.onNode(hasText(text) and isPlaced, useUnmergedTree = true).getUnclippedBoundsInRoot()

    private fun assertGoalUnderTheFullCap() {
        assertTrue("$FARM_GOAL under $FULL_CAP", placedBoundsOf(FULL_CAP).bottom <= placedBoundsOf(FARM_GOAL).top)
    }

    private fun assertNamesTheFullCap() {
        composeRule.onNode(hasText(FULL_CAP) and isPlaced, useUnmergedTree = true).assertExists()
        composeRule.onAllNodes(hasText(NO_REVIEWS_DUE, substring = true), useUnmergedTree = true).assertCountEquals(0)
    }

    private val releasedStep: TownStatusUiState.Dock.Step = stepOf(
        line = NextStepCard.Line.ReleasedLesson(PlacementBand.Second, number = 1),
        go = TownStatusUiState.Go.Acts(NextStepCard.Action.StudyReleased(releasedLesson), isBusy = false),
    )

    @Test
    @Config(qualifiers = PHONE)
    fun `names the full learning cap on the What is next card`() {
        showInEnglish { TownDock(dock = fullCapStep, actions = recordingActions, onFoldChange = {}) }

        assertNamesTheFullCap()
    }

    @Test
    fun `names the full learning cap on the folded dock`() {
        showInEnglish { TownDockTop(dock = fullCapStep) }

        assertNamesTheFullCap()
    }

    @Test
    @Config(qualifiers = PHONE)
    fun `draws the goal under the full learning cap on the What is next card`() {
        showInEnglish { TownDock(dock = fullCapWithGoal, actions = recordingActions, onFoldChange = {}) }

        assertGoalUnderTheFullCap()
    }

    @Test
    fun `draws the goal under the full learning cap on the folded dock`() {
        showInEnglish { TownDockTop(dock = fullCapWithGoal) }

        assertGoalUnderTheFullCap()
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

        composeRule.onNode(hasText(STUDY_SLOT_BUSY), useUnmergedTree = true).assertExists()
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
        const val NO_REVIEWS_DUE: String = "No reviews due now."
        const val FARM_GOAL: String = "Goal 1 of 9: Farm, level 1"
        const val PHONE: String = "+w411dp-h891dp"
        const val STUDY_SLOT_BUSY: String = "La escuela ya tiene un estudio en marcha. Espera a que termine."
    }
}
