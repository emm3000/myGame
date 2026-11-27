package com.emm.mygame.navigation

import com.emm.mygame.Destination
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class LessonFinishNavigationTest : AppNavigationFixture() {

    @Test
    fun `reads the town at the lesson's finish on the news`() {
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        showLessonOneNearItsFinish(Destination.Today, Destination.Town, Destination.News)
        runBlocking { towns.read() }

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `reads the town at the lesson's finish on the reviews`() {
        learning.answerRead(noReviews)
        onLessonOneNearItsFinish(Destination.Today, Destination.Town, Destination.Review)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `reads the town at the lesson's finish on a text`() {
        onLessonOneNearItsFinish(
            Destination.Today,
            Destination.Town,
            Destination.School,
            Destination.SchoolText(TextId("text-1")),
        )

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the town home`() {
        onLessonOneNearItsFinish(Destination.Today, Destination.Town)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the school`() {
        showLessonOneNearItsFinish(Destination.Today, Destination.Town, Destination.School)
        waitForLine(STUDYING_REFUND)

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }

    @Test
    fun `leaves the read at the lesson's finish to the lesson's words`() {
        repeat(2) { learning.answerRead(walkReviews) }
        onLessonOneNearItsFinish(Destination.Today, Destination.Town, Destination.LessonWords(firstLesson, emptyList()))

        passingTheFinish()

        assertEquals(READS_ON_ARRIVAL + 1, towns.readCount)
    }
}
