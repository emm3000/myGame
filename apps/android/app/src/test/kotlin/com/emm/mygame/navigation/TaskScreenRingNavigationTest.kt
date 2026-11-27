package com.emm.mygame.navigation

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasText
import com.emm.mygame.Destination
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.shadows.ShadowLooper
import java.util.concurrent.TimeUnit

@RunWith(ParameterizedRobolectricTestRunner::class)
class TaskScreenRingNavigationTest(private val task: Task) : AppNavigationFixture() {

    enum class Task(val shown: Destination) {
        Placement(Destination.Placement),
        HoldoutCheck(Destination.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)),
        Reviews(Destination.Review),
        LessonWords(Destination.LessonWords(LessonId("lesson-1"), walked = emptyList())),
    }

    @Test
    fun `a task screen's header draws no ring`() {
        learning.answerRead(noReviews)
        showingStack(Destination.Today, Destination.Town, task.shown, town = playedTown(retainedWords = threeOfFive))
        link("Pueblo")
        ShadowLooper.idleMainLooper(1, TimeUnit.SECONDS)
        composeRule.waitForIdle()

        composeRule.onAllNodes(hasText(THREE_OF_FIVE)).assertCountEquals(0)
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun tasks(): List<Task> = Task.entries
    }
}
