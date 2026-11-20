package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.FrameSpan
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.TownNewsReadResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownReport
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.townOf
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class OpenAboveNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val fixedClock: Clock = object : Clock {
        override fun now(): Instant = readAt
    }

    private val towns: FakeTownRepository = FakeTownRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val dependencies: AppDependencies = dependenciesOf(
        clock = fixedClock,
        towns = towns,
        reports = reports,
    )

    private val newestText: TownSnapshot.OpenText = TownSnapshot.OpenText(
        id = TextId("text-31"),
        title = "The New Shop",
        sentences = listOf(listOf(FrameSpan("We open a shop on the river.", null))),
    )

    private val townWithANewestText: TownSnapshot = townOf(readAt, texts = listOf(newestText))

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList())

    private var shownStack: NavBackStack<NavKey>? = null

    @Test
    fun `opens the news above the Report`() {
        reports.answerRead(ReportReadResult.Read(nothingDue))
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        showing(Destination.Town, Destination.Report)

        waitedForLink("Leer todas las noticias").performScrollTo().performClick()

        assertStackEndsWith(Destination.Report, Destination.News)
    }

    @Test
    fun `opens a text above the school from its row`() {
        showing(Destination.Town, Destination.School)

        waitedForLink(newestText.title).performScrollTo().performClick()

        assertStackEndsWith(Destination.School, Destination.SchoolText(newestText.id))
    }

    private fun showing(vararg destinations: Destination) {
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(townWithANewestText)) }
        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
                    backStack = rememberNavBackStack(*destinations).also { shown: NavBackStack<NavKey> ->
                        shownStack = shown
                    },
                )
            }
        }
    }

    private fun waitedForLink(label: String): SemanticsNodeInteraction {
        val link: SemanticsMatcher = hasText(label).and(hasClickAction())
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(link).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(link)
    }

    private fun assertStackEndsWith(vararg destinations: Destination) {
        composeRule.waitForIdle()
        assertEquals(destinations.toList(), shownStack.orEmpty().takeLast(destinations.size))
    }

    private companion object {
        const val READS_AVAILABLE: Int = 6
        const val WAIT_MILLIS: Long = 5_000
    }
}
