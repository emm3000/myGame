package com.emm.mygame

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.performClick
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.school.RetainedWords
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.model.town.school.TownLessonResult
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
class DockFrameNavigationTest : DockFrameFixture() {

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the school reads after the header and before the go button and the school`() {
        assertFoldedOrder(Destination.School, title = "Escuela")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the Report reads after the header and before the go button and the Report`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        assertFoldedOrder(Destination.Report, title = "Informe")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the news reads after the header and before the go button and the news`() {
        assertFoldedOrder(Destination.Report, Destination.News, title = "Noticias del pueblo")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the map reads after the header and before the go button and the map`() {
        assertFoldedOrder(Destination.Map, title = "Mapa")
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a refusal folded on the settings reads after the header and before the go button and the settings`() {
        assertFoldedOrder(Destination.Report, Destination.Settings, title = "Ajustes")
    }

    private fun assertFoldedOrder(vararg place: NavKey, title: String) {
        towns.answerLesson(TownLessonResult.Refused(TownLessonRefusal.StudySlotBusy))
        showing(
            Destination.Town,
            *place,
            town = playedTown(nextStep = releasedLesson).copy(learning = learningWithRing),
        )
        dockGo(STUDY_RELEASED).performClick()
        waitFor(foldedRefusal)
        waitFor(hasText(THREE_OF_FIVE))
        waitFor(hasText(title, ignoreCase = true).and(isHeading()))

        val header: Int = composeRule.onNode(hasText(THREE_OF_FIVE)).fetchSemanticsNode().id
        val refusal: Int = composeRule.onNode(foldedRefusal).fetchSemanticsNode().id
        val go: Int = dockGo(STUDY_RELEASED).fetchSemanticsNode().id
        val screen: Int = composeRule.onNode(hasText(title, ignoreCase = true).and(isHeading())).fetchSemanticsNode().id
        val expected: List<Int> = listOf(header, refusal, go, screen)

        val order: List<Int> = composeRule.traversalIds()

        assertEquals(expected, order.filter { id: Int -> id in expected })
    }

    @Test
    fun `the dock comes right after the header for TalkBack`() {
        showing(Destination.Town, Destination.School, town = playedTown().copy(learning = learningWithRing))
        dockGo("Ir al informe")
        waitFor(hasText(THREE_OF_FIVE))

        val header: Int = composeRule.onNode(hasText(THREE_OF_FIVE)).fetchSemanticsNode().id
        val go: Int = dockGo(REPORT_GO).fetchSemanticsNode().id

        val order: List<Int> = composeRule.traversalIds()

        assertEquals(order.indexOf(header) + 1, order.indexOf(go))
    }

    @Test
    fun `the town home's dock comes right after the home's header for TalkBack`() {
        showing(Destination.Town, town = playedTown().copy(learning = learningWithRing))
        dockGo("Ir al informe")
        waitFor(hasText(THREE_OF_FIVE))

        val header: List<Int> = listOf(TOWN_HEADER, "Edificio 1 de 2").map { line: String ->
            composeRule.onNode(hasText(line)).fetchSemanticsNode().id
        } + composeRule.onNode(hasText(THREE_OF_FIVE)).fetchSemanticsNode().id
        val go: Int = dockGo(REPORT_GO).fetchSemanticsNode().id

        val order: List<Int> = composeRule.traversalIds()

        assertEquals(header.maxOf { id: Int -> order.indexOf(id) } + 1, order.indexOf(go))
    }

    private val learningWithRing: TownSnapshot.Learning =
        TownSnapshot.Learning(
            cap = 10,
            inLearning = 0,
            retainedWords = RetainedWords(count = 3, total = 5),
            nextInLearningDueAt = null,
        )

    private companion object {
        const val THREE_OF_FIVE: String = "3 de 5 palabras aprendidas"
    }
}
