package com.emm.mygame

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.feature.town.status.TOWN_DOCK
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NamingDockNavigationTest : DockFrameFixture() {

    private fun firstFrameShowing(matcher: SemanticsMatcher) {
        repeat(FRAME_LIMIT) {
            composeRule.mainClock.advanceTimeByFrame()
            if (composeRule.onAllNodes(matcher).fetchSemanticsNodes().isNotEmpty()) return
        }
        fail("no frame drew $matcher")
    }

    @Test
    fun `the naming screen draws no dock while the status read waits`() {
        showing(Destination.Town, townReads = 0)
        towns.answerRead(TownReadResult.NoTown)
        waitFor(hasText(NAMING_TITLE))

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
    }

    @Test
    fun `the naming screen draws no Report row`() {
        showing(Destination.Town, townReads = 0)
        towns.answerRead(TownReadResult.NoTown)
        waitFor(hasText(NAMING_TITLE))

        composeRule.onAllNodes(reportRow).assertCountEquals(0)
    }

    @Test
    fun `the naming screen draws no dock on its first frame`() {
        showing(Destination.Town, townReads = 0)
        waitFor(hasTestTag(TOWN_DOCK))
        composeRule.mainClock.autoAdvance = false

        towns.answerRead(TownReadResult.NoTown)
        firstFrameShowing(hasText(NAMING_TITLE))

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
    }

    @Test
    fun `the naming screen draws no dock while it signs out`() {
        showing(Destination.Town, townReads = 0)
        towns.answerRead(TownReadResult.NoTown)
        waitFor(hasText(NAMING_TITLE))

        composeRule.onNodeWithText(SIGN_OUT).performScrollTo().performClick()
        composeRule.waitUntil(WAIT_MILLIS) { sessions.signOutCount == 1 }
        composeRule.waitForIdle()

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
    }

    @Test
    fun `the naming screen draws no dock once the status read is refused`() {
        showing(Destination.Town, townReads = 0)
        towns.answerRead(TownReadResult.NoTown)
        repeat(STATUS_AND_RING_READS) { towns.answerRead(TownReadResult.Unreachable) }
        waitFor(hasText(NAMING_TITLE))
        composeRule.waitForIdle()

        composeRule.onAllNodes(hasTestTag(TOWN_DOCK)).assertCountEquals(0)
    }

    private companion object {
        const val FRAME_LIMIT: Int = 60
        const val SIGN_OUT: String = "Salir"
        const val NAMING_TITLE: String = "Ponle nombre a tu pueblo"
    }
}
