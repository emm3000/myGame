package com.emm.mygame

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.feature.town.status.TOWN_DOCK
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class FrameLinkNavigationTest : DockFrameFixture() {

    private val townLink: SemanticsMatcher =
        hasText(TOWN_LINK).and(hasClickAction()).and(!hasAnyAncestor(hasTestTag(TOWN_DOCK)))

    private fun headerLink(): SemanticsNodeInteraction {
        waitFor(townLink)
        return composeRule.onNode(townLink)
    }

    private fun assertHeaderLinkOpensTown(vararg place: NavKey) {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        showing(Destination.Town, *place)
        headerLink()
        composeRule.onAllNodes(hasText("Pueblo", ignoreCase = true).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))
            .assertCountEquals(0)

        headerLink().performClick()

        waitFor(hasText(TOWN_HEADER))
        assertEquals(listOf<NavKey>(Destination.Town), shownStack?.toList())
    }

    @Test
    fun `the town home's Report row opens the Report`() {
        showing(Destination.Town, town = playedTown(nextStep = releasedLesson))
        reports.answerRead(ReportReadResult.Read(nothingDue))
        waitFor(reportRow)
        composeRule.onAllNodes(inTheDock(REPORT_ROW)).assertCountEquals(0)

        composeRule.onNode(reportRow).performClick()

        waitFor(hasText("NOTICIAS DEL PUEBLO"))
    }

    @Test
    fun `the school's header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.School)
    }

    @Test
    fun `the Report's header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Report)
    }

    @Test
    fun `the news' header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Report, Destination.News)
    }

    @Test
    fun `the settings' header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Report, Destination.Settings)
    }

    @Test
    fun `the map's header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Map)
    }

    @Test
    fun `the system back button still pops one entry from a place screen`() {
        showing(Destination.Town, Destination.Report, Destination.News)
        headerLink()

        composeRule.runOnUiThread { composeRule.activity.onBackPressedDispatcher.onBackPressed() }
        composeRule.waitForIdle()

        assertEquals(listOf<NavKey>(Destination.Town, Destination.Report), shownStack?.toList())
    }

    @Test
    fun `a loading dock waits and the header's link still opens the town`() {
        showing(Destination.Town, Destination.Report, townReads = 0)
        waitFor(hasTestTag(INK_PILL).and(hasStateDescription(WAITING)).and(hasAnyAncestor(hasTestTag(TOWN_DOCK))))

        headerLink().performClick()
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(playedTown())) }

        waitFor(hasText(TOWN_HEADER))
    }

    @Test
    fun `a refused dock leaves the Report row at the top of the town home that could not be read`() {
        repeat(TOWN_STATUS_AND_RING_READS) { towns.answerRead(TownReadResult.Unreachable) }
        showing(Destination.Town, townReads = 0)
        dockGo(TRY_AGAIN)

        waitFor(reportRow.and(hasAnyAncestor(hasScrollAction())))
    }

    @Test
    fun `a refused dock offers the retry and the header's link still opens the town`() {
        repeat(STATUS_AND_RING_READS) { towns.answerRead(TownReadResult.Unreachable) }
        showing(Destination.Town, Destination.Report, townReads = 0)
        dockGo(TRY_AGAIN)

        headerLink().performClick()
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(playedTown())) }

        waitFor(hasText(TOWN_HEADER))
    }

    private companion object {
        const val TOWN_LINK: String = "Pueblo"
        const val TRY_AGAIN: String = "Volver a intentarlo"
        const val TOWN_STATUS_AND_RING_READS: Int = 3
    }
}
