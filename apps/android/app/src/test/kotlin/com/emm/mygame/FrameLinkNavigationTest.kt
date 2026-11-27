package com.emm.mygame

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.performClick
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.designsystem.navigation.NAVIGATION_BAR
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.TownReadResult
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class FrameLinkNavigationTest : SignedInScreenFixture() {

    private val townLink: SemanticsMatcher =
        hasText(TOWN_LINK).and(hasClickAction()).and(!hasAnyAncestor(hasTestTag(NAVIGATION_BAR)))

    private fun headerLink(): SemanticsNodeInteraction {
        waitFor(townLink)
        return composeRule.onNode(townLink)
    }

    private fun assertHeaderLinkOpensTown(vararg place: NavKey) {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        showing(Destination.Today, Destination.Town, *place)
        headerLink().performClick()

        waitFor(hasText(TOWN_HEADER))
        assertEquals(listOf<NavKey>(Destination.Today, Destination.Town), shownStack?.toList())
    }

    @Test
    fun `the news' header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.News)
    }

    @Test
    fun `the map's header draws the link that opens the town`() {
        assertHeaderLinkOpensTown(Destination.Map)
    }

    @Test
    fun `the system back button still pops one entry from a place screen`() {
        showing(Destination.Today, Destination.Town, Destination.News)
        headerLink()

        composeRule.runOnUiThread { composeRule.activity.onBackPressedDispatcher.onBackPressed() }
        composeRule.waitForIdle()

        assertEquals(listOf<NavKey>(Destination.Today, Destination.Town), shownStack?.toList())
    }

    @Test
    fun `the header's link opens the town while no town is read yet`() {
        showing(Destination.Today, Destination.Town, Destination.News, townReads = 0)

        headerLink().performClick()
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(playedTown())) }

        waitFor(hasText(TOWN_HEADER))
    }

    private companion object {
        const val TOWN_LINK: String = "Pueblo"
    }
}
