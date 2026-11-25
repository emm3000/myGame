package com.emm.mygame.navigation

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.NAVIGATION_BAR
import com.emm.mygame.core.model.town.TownReadResult
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TodayNavigationTest : AppNavigationFixture() {

    @Test
    fun `a town with no name shows the naming alone with no bar`() {
        signedInReading(TownReadResult.NoTown)

        waitForLine(NAMING_TITLE)

        composeRule.onAllNodes(hasTestTag(NAVIGATION_BAR)).assertCountEquals(0)
    }

    @Test
    fun `a running lesson's row in In progress opens its words`() {
        signedInReading(TownReadResult.Read(runningTown()))
        repeat(2) { learning.answerRead(noReviews) }

        link(LESSON_ONE_READY).performClick()

        waitForLine("I drink water.")
    }

    @Test
    fun `a task screen draws no bar`() {
        signedInReading(TownReadResult.Read(runningTown()))
        repeat(2) { learning.answerRead(noReviews) }
        link(LESSON_ONE_READY).performClick()
        waitForLine("I drink water.")

        composeRule.onAllNodes(hasTestTag(NAVIGATION_BAR)).assertCountEquals(0)
    }

    @Test
    fun `Learn carries the count the reviews hold`() {
        signedInReading(TownReadResult.Read(reviewsDueTown))

        waitedFor(hasContentDescription("Aprender, 3").and(hasAnyAncestor(hasTestTag(NAVIGATION_BAR))))
    }

    private companion object {
        const val NAMING_TITLE: String = "Ponle nombre a tu pueblo"
    }
}
