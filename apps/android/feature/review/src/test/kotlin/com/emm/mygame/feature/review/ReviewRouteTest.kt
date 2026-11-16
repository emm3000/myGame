package com.emm.mygame.feature.review

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.testing.TestLifecycleOwner
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakeTownRepository
import java.util.concurrent.TimeUnit
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.shadows.ShadowLooper

@RunWith(RobolectricTestRunner::class)
class ReviewRouteTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val learning: FakeLearningRepository = FakeLearningRepository()

    private val movableClock: MovableClock = MovableClock()

    private val appOwner: TestLifecycleOwner = TestLifecycleOwner(Lifecycle.State.RESUMED)

    private fun showNothingDueNearItsInstant() {
        learning.answerRead(nothingDueUntil(firstReadAt + NEAR_DUE))
        showRoute()
        waitForNothingDue()
    }

    private fun showRoute() {
        composeRule.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides appOwner) {
                MyGameTheme {
                    ReviewRoute(
                        learning = learning,
                        towns = FakeTownRepository(),
                        clock = movableClock,
                        onLessonOpen = {},
                        onTownOpen = {},
                    )
                }
            }
        }
    }

    private fun waitForNothingDue() {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText("Siguiente repaso:", substring = true)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun passingTheDueInstantInTheBackground() {
        composeRule.runOnIdle { appOwner.currentState = Lifecycle.State.CREATED }
        movableClock.passed += NEAR_DUE + 1.seconds
        ShadowLooper.idleMainLooper(BACKGROUND_MINUTES, TimeUnit.MINUTES)
        composeRule.waitForIdle()
    }

    @Test
    fun `reads nothing at the due instant while the app is in the background`() {
        showNothingDueNearItsInstant()

        passingTheDueInstantInTheBackground()

        assertEquals(1, learning.readCount)
    }

    @Test
    fun `reads the reviews past the due instant on return from the background`() {
        showNothingDueNearItsInstant()
        passingTheDueInstantInTheBackground()

        composeRule.runOnIdle { appOwner.currentState = Lifecycle.State.RESUMED }
        composeRule.waitUntil(WAIT_MILLIS) { learning.readCount > 1 }

        assertEquals(2, learning.readCount)
    }

    @Test
    fun `reads the reviews again on return when the first read was cut off`() {
        showRoute()
        composeRule.waitUntil(WAIT_MILLIS) { learning.readCount == 1 }
        composeRule.runOnIdle { appOwner.currentState = Lifecycle.State.CREATED }
        learning.answerRead(nothingDueUntil(firstReadAt + NEAR_DUE))

        composeRule.runOnIdle { appOwner.currentState = Lifecycle.State.RESUMED }
        waitForNothingDue()

        assertEquals(2, learning.readCount)
    }

    private class MovableClock : Clock {

        var passed: Duration = Duration.ZERO

        override fun now(): Instant = firstReadAt + passed
    }

    private companion object {
        val NEAR_DUE: Duration = 30.seconds
        const val BACKGROUND_MINUTES: Long = 2
        const val WAIT_MILLIS: Long = 5_000
    }
}
