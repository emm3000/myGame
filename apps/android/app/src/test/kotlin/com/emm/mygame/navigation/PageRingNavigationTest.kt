package com.emm.mygame.navigation

import androidx.compose.ui.test.assertIsDisplayed
import com.emm.mygame.Destination
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.ParameterizedRobolectricTestRunner

@RunWith(ParameterizedRobolectricTestRunner::class)
class PageRingNavigationTest(private val page: Page) : AppNavigationFixture() {

    enum class Page(val stack: List<Destination>) {
        Today(listOf(Destination.Today)),
        Town(listOf(Destination.Today, Destination.Town)),
        Learn(listOf(Destination.Today, Destination.School)),
        Me(listOf(Destination.Today, Destination.Settings)),
        Place(listOf(Destination.Today, Destination.Town, Destination.Place(TownBuildingKind.Farm))),
        SchoolText(listOf(Destination.Today, Destination.School, Destination.SchoolText(TextId("text-1")))),
    }

    @Test
    fun `each tab's root and each place's page draws the ring and reads the town for it`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        showingStack(*page.stack.toTypedArray(), town = playedTown(retainedWords = threeOfFive))

        waitForRing(THREE_OF_FIVE)

        ring(THREE_OF_FIVE).assertIsDisplayed()
    }

    companion object {
        @JvmStatic
        @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
        fun pages(): List<Page> = Page.entries
    }
}
