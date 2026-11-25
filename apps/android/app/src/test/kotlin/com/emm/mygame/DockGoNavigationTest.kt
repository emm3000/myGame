package com.emm.mygame

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.feature.town.status.TOWN_DOCK
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.hours

@RunWith(RobolectricTestRunner::class)
class DockGoNavigationTest : DockFrameFixture() {

    private val secondLesson: LessonId = LessonId("lesson-2")

    @Test
    fun `the Report's own step waits and sends nothing`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        showing(Destination.Today, Destination.Town, Destination.Report)
        val go: SemanticsNodeInteraction = dockGo("Ir al informe")
        composeRule.waitForIdle()
        val townReads: Int = towns.readCount

        go.assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, NO_REVIEWS_DUE)).performClick()

        composeRule.waitForIdle()
        composeRule.onNode(hasText("NOTICIAS DEL PUEBLO")).assertExists()
        assertEquals(townReads, towns.readCount)
        assertEquals(1, reports.readCount)
    }

    @Test
    fun `the school's study step studies that lesson in place`() {
        towns.answerLesson(TownLessonResult.Unreachable)
        showing(
            Destination.Today,
            Destination.Town,
            Destination.School,
            town = playedTown(nextStep = NextStep.LessonToStudy(firstLesson)),
        )

        dockGo("Estudiar la lección 1 · 5:00").performClick()

        composeRule.waitUntil(WAIT_MILLIS) { towns.lessonStarts == listOf(firstLesson) }
        composeRule.onAllNodesWithText(TOWN_HEADER).assertCountEquals(0)
    }

    @Test
    fun `the school studies the lesson the status shows when its own read is older`() {
        val older: TownSnapshot = playedTown()
        val newer: TownSnapshot = playedTown(nextStep = NextStep.LessonToStudy(secondLesson))
            .copy(lessons = listOf(lessonOf(firstLesson).copy(isStudied = true), lessonOf(secondLesson)))
        showing(Destination.Today, Destination.Town, Destination.School, townReads = 0)
        towns.answerRead(TownReadResult.Read(older))
        towns.answerRead(TownReadResult.Read(newer))

        dockGo(STUDY_SECOND).performClick()

        composeRule.waitUntil(WAIT_MILLIS) { towns.lessonStarts == listOf(secondLesson) }
    }

    @Test
    fun `a refused start of the lesson the status shows draws its line on the school`() {
        val older: TownSnapshot = playedTown()
        val newer: TownSnapshot = playedTown(nextStep = NextStep.LessonToStudy(secondLesson))
            .copy(lessons = listOf(lessonOf(firstLesson).copy(isStudied = true), lessonOf(secondLesson)))
        towns.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))
        showing(Destination.Today, Destination.Town, Destination.School, townReads = 0)
        towns.answerRead(TownReadResult.Read(older))
        towns.answerRead(TownReadResult.Read(newer))

        dockGo(STUDY_SECOND).performClick()

        waitFor(hasText(STUDY_SLOT_BUSY))
    }

    private val fullCapTown: TownSnapshot =
        playedTown(nextStep = NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null, text = null)).copy(
            learning = TownSnapshot.Learning(
                cap = 10,
                inLearning = 8,
                retainedWords = null,
                nextInLearningDueAt = readAt + 3.hours,
            ),
        )

    private val drawnText: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsProperties.Text)

    @Test
    fun `the school's dock draws neither the cap's line nor the time the next word is due`() {
        showing(Destination.Today, Destination.Town, Destination.School, town = fullCapTown)
        waitFor(hasText(NEXT_WORD_DUE, substring = true).and(!hasAnyAncestor(hasTestTag(TOWN_DOCK))))
        dockGo(REPORT_GO)

        composeRule.onAllNodes(hasText(CAP_FIGURE, substring = true).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))
            .assertCountEquals(0)
        composeRule.onAllNodes(drawnText.and(hasAnyAncestor(hasTestTag(TOWN_DOCK))).and(!hasTestTag(INK_PILL)))
            .assertCountEquals(0)
    }

    private fun assertOneGoButton() {
        dockGo("Ir al informe")
        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(1)
    }

    @Test
    fun `the school's go to read the words opens that lesson's words`() {
        showing(
            Destination.Town,
            Destination.School,
            town = playedTown(NextStep.Reviews(count = 3, readFirst = listOf(secondLesson)))
                .copy(lessons = listOf(lessonOf(firstLesson), lessonOf(secondLesson))),
        )

        dockGo(READ_THE_WORDS).performClick()

        composeRule.waitUntil(WAIT_MILLIS) { shownStack?.lastOrNull() is Destination.LessonWords }
        assertEquals(Destination.LessonWords(secondLesson, walked = emptyList()), shownStack?.lastOrNull())
    }

    @Test
    fun `the town home draws one go button`() {
        showing(Destination.Today, Destination.Town)

        assertOneGoButton()
    }

    @Test
    fun `the school draws one go button`() {
        showing(Destination.Today, Destination.Town, Destination.School)

        assertOneGoButton()
    }

    @Test
    fun `the Report draws one go button`() {
        reports.answerRead(ReportReadResult.Read(nothingDue.copy(dueCount = 3)))
        val reviewsDue: TownSnapshot = playedTown(NextStep.Reviews(count = 3, readFirst = emptyList()))
        showing(Destination.Today, Destination.Town, Destination.Report, town = reviewsDue)
        dockGo("Empezar los repasos")
        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(1)
    }

    @Test
    fun `the news draws one go button`() {
        showing(Destination.Today, Destination.Town, Destination.Report, Destination.News)

        assertOneGoButton()
    }

    @Test
    fun `the map draws one go button`() {
        showing(Destination.Today, Destination.Town, Destination.Map)

        assertOneGoButton()
    }

    @Test
    fun `the settings draw one go button`() {
        showing(Destination.Today, Destination.Town, Destination.Report, Destination.Settings)

        assertOneGoButton()
    }

    @Test
    fun `the school's read-words step waits while the lesson is studied`() {
        showing(
            Destination.Town,
            Destination.School,
            town = playedTown(nextStep = NextStep.LessonRunning(goal = null, text = null)),
        )

        val studying: SemanticsMatcher =
            SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "En estudio")
        dockGo("Leer las palabras").assert(studying)
    }

    private companion object {
        const val STUDY_SECOND: String = "Estudiar la lección 2 · 5:00"
        const val NO_REVIEWS_DUE: String = "No tienes repasos pendientes ahora."
        const val READ_THE_WORDS: String = "Leer las palabras"
        const val NEXT_WORD_DUE: String = "La siguiente palabra en aprendizaje se repasa en"
        const val CAP_FIGURE: String = "8 de 10"
    }
}
