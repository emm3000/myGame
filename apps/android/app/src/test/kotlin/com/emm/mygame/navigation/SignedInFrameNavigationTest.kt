package com.emm.mygame.navigation

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import com.emm.mygame.Destination
import com.emm.mygame.core.designsystem.control.INK_PILL
import com.emm.mygame.core.designsystem.navigation.NAVIGATION_BAR
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.shadows.ShadowLooper
import java.util.concurrent.TimeUnit

@RunWith(ParameterizedRobolectricTestRunner::class)
class SignedInFrameNavigationTest(private val screen: Screen) : AppNavigationFixture() {

    enum class Screen(val stack: List<Destination>, val doorAbove: String? = null) {
        Today(listOf(Destination.Today)),
        Town(listOf(Destination.Today, Destination.Town)),
        School(listOf(Destination.Today, Destination.School)),
        Settings(listOf(Destination.Today, Destination.Settings)),
        News(listOf(Destination.Today, Destination.Town), doorAbove = "Noticias del pueblo"),
        Map(listOf(Destination.Today, Destination.Town, Destination.Map)),
    }

    @Test
    fun `no signed-in screen draws a dock`() {
        showingTheScreen()
        composeRule.onAllNodes(footGo, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `no signed-in screen draws a status line under its header`() {
        showingTheScreen()
        composeRule.onAllNodes(lineUnderHeader, useUnmergedTree = true).assertCountEquals(0)
    }

    private fun showingTheScreen() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        showingStack(*screen.stack.toTypedArray(), town = runningTown())
        composeRule.waitUntil(WAIT_MILLIS) { towns.readCount > 0 }
        screen.doorAbove?.let { door: String -> link(door).performClick() }
        ShadowLooper.idleMainLooper(1, TimeUnit.SECONDS)
        composeRule.waitForIdle()
    }

    private val outsideContent: SemanticsMatcher =
        !hasAnyAncestor(hasScrollAction()) and !hasAnyAncestor(hasTestTag(NAVIGATION_BAR))

    private val footGo: SemanticsMatcher = hasTestTag(INK_PILL) and outsideContent

    private val lineUnderHeader: SemanticsMatcher = hasText(LESSON_ONE_READY, substring = true) and outsideContent

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun screens(): List<Screen> = Screen.entries
    }
}
