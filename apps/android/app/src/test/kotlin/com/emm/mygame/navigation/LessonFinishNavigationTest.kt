package com.emm.mygame.navigation

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.Destination
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.TownReadResult
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LessonFinishNavigationTest : AppNavigationFixture() {

    @Test
    fun `reads the town at the lesson's finish on the Report`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        onLessonOneNearItsFinish(Destination.Town, Destination.Report)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `reads the town at the lesson's finish on the reviews`() {
        learning.answerRead(noReviews)
        onLessonOneNearItsFinish(Destination.Town, Destination.Review)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `reads the town at the lesson's finish on a text`() {
        onLessonOneNearItsFinish(Destination.Town, Destination.School, Destination.SchoolText(TextId("text-1")))

        passingTheFinish(readsOnArrival = READS_ON_ARRIVAL_ON_A_TEXT)

        assertEquals(READS_ON_ARRIVAL_ON_A_TEXT + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the town home`() {
        onLessonOneNearItsFinish(Destination.Town)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the school`() {
        showLessonOneNearItsFinish(Destination.Town, Destination.School)
        waitForLine(STUDYING_REFUND)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the lesson's words`() {
        repeat(2) { learning.answerRead(walkReviews) }
        onLessonOneNearItsFinish(Destination.Town, Destination.LessonWords(firstLesson, emptyList()))

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `closes the finish notice on the reviews`() {
        asLessonOneFinishes(finishedTown(readFirst = emptyList()))
        learning.answerRead(noReviews)
        towns.answerRead(TownReadResult.Read(finishedTown(readFirst = emptyList())))

        dockGo("Empezar los repasos").performClick()
        waitForLine("Aún no tienes palabras que repasar.")

        composeRule.onAllNodesWithText(LESSON_ONE_DONE).assertCountEquals(0)
    }

    @Test
    fun `closes the finish notice on the unread words`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))
        repeat(2) { towns.answerRead(TownReadResult.Read(finishedTown(listOf(firstLesson)))) }
        learning.answerRead(walkReviews)

        dockGo("Leer las palabras").performClick()
        waitForLine("I drink water.")

        composeRule.onAllNodesWithText(LESSON_ONE_DONE).assertCountEquals(0)
    }

    @Test
    fun `draws no status on the town home with no lesson running`() {
        signedInAtTown()

        assertNoStatus()
    }

    @Test
    fun `draws no status on the Report with no lesson running`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        showingStack(Destination.Town, Destination.Report, town = playedTown(retainedWords = threeOfFive))
        waitForRing(THREE_OF_FIVE)

        assertNoStatus()
    }

    @Test
    fun `draws the finish notice's close as its only control on the placement`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)), Destination.Town, Destination.Placement)

        assertCloseIsTheNoticeOnlyControl()
    }

    @Test
    fun `draws the finish notice's close as its only control on the holdout check`() {
        asLessonOneFinishes(
            finishedTown(readFirst = listOf(firstLesson)),
            Destination.Town,
            Destination.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth),
        )

        assertCloseIsTheNoticeOnlyControl()
    }

    @Test
    fun `closes the finish notice`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))

        composeRule.onNodeWithText("Cerrar").performClick()
        composeRule.waitForIdle()

        composeRule.onAllNodesWithText(LESSON_ONE_DONE).assertCountEquals(0)
    }

    @Test
    fun `keeps the finish notice on the way home from the Report`() {
        asLessonOneFinishes(finishedTown(readFirst = listOf(firstLesson)))
        repeat(2) { towns.answerRead(TownReadResult.Read(finishedTown(listOf(firstLesson)))) }

        link("Pueblo").performClick()
        waitForLine(TOWN_HEADER)

        composeRule.onNodeWithText(LESSON_ONE_DONE).assertIsDisplayed()
    }
}
