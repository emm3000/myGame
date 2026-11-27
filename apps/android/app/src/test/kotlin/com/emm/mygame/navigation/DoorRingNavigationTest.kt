package com.emm.mygame.navigation

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasText
import com.emm.mygame.Destination
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.shadows.ShadowLooper
import java.util.concurrent.TimeUnit

@RunWith(ParameterizedRobolectricTestRunner::class)
class DoorRingNavigationTest(private val door: Door) : AppNavigationFixture() {

    enum class Door(val shown: Destination) {
        News(Destination.News),
        Map(Destination.Map),
    }

    @Test
    fun `a door's page draws no ring`() {
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        showingStack(Destination.Today, Destination.Town, door.shown, town = playedTown(retainedWords = threeOfFive))
        link("Pueblo")
        ShadowLooper.idleMainLooper(1, TimeUnit.SECONDS)
        composeRule.waitForIdle()

        composeRule.onAllNodes(hasText(THREE_OF_FIVE)).assertCountEquals(0)
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun doors(): List<Door> = Door.entries
    }
}
