package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownLessonRefusal
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

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

    private val releasedStep: TownStatusUiState.Dock.Step = stepOf(
        line = NextStepCard.Line.ReleasedLesson(PlacementBand.Second, number = 1),
        go = TownStatusUiState.Go.Acts(NextStepCard.Action.StudyReleased(releasedLesson), isBusy = false),
    )

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

    private fun stateDescriptionStarting(words: String): SemanticsMatcher =
        SemanticsMatcher("state description starts with $words") { node ->
            node.config.getOrElseNullable(SemanticsProperties.StateDescription) { null }?.startsWith(words) == true
        }

    private companion object {
        const val STUDY_SLOT_BUSY: String = "La escuela ya tiene un estudio en marcha. Espera a que termine."
    }
}
