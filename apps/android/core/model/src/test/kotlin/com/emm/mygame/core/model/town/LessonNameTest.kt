package com.emm.mygame.core.model.town

import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import org.junit.Assert.assertEquals
import org.junit.Test

class LessonNameTest : LessonTownFixture() {

    @Test
    fun `names a released lesson by its band and set`() {
        assertEquals(
            LessonName.Released(PlacementBand.Second, set = 3),
            townOf(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)).nameOf(releasedLesson),
        )
    }

    @Test
    fun `names a shelved lesson by its place among the lessons`() {
        val caughtUp: NextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)

        assertEquals(LessonName.Shelved(number = 1), townOf(caughtUp).nameOf(shelvedLesson))
    }
}
