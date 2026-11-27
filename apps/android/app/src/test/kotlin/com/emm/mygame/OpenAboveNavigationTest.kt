package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.report.ReportReadResult
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.navigation.AppNavigation
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

    private val newestText: TownSnapshot.TextTitle = TownSnapshot.TextTitle(TextId("text-31"), "The New Shop")

    private val townWithANewestText: TownSnapshot = townOf(readAt, texts = listOf(newestText))

    private val caughtUpWithTheNewestText: TownSnapshot = townOf(
        readAt,
        nextStep = NextStep.CaughtUp(
            reason = CaughtUpReason.LessonsDone,
            goal = null,
            text = NextStepText(newestText.id, newestText.title),
        ),
        texts = listOf(newestText),
    )

    private val nothingDue: TownReport =
        TownReport(dueCount = 0, readFirst = emptyList(), nextDueAt = null, news = emptyList(), readAt = readAt)

    private var shownStack: NavBackStack<NavKey>? = null

    @Test
    fun `opens the news above Today`() {
        reports.answerRead(ReportReadResult.Read(nothingDue.copy(news = listOf(TownNews.LessonStopped(readAt)))))
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        showing(Destination.Today)

        waitedForLink("Leer todas las noticias").performScrollTo().performClick()

        assertStackEndsWith(Destination.Today, Destination.News)
    }

    @Test
    fun `opens a text above the school from its row`() {
        showing(Destination.Today, Destination.Town, Destination.School)

        waitedForLink(newestText.title).performScrollTo().performClick()

        assertStackEndsWith(Destination.School, Destination.SchoolText(newestText.id))
    }

    @Test
    fun `opens the newest open text above Today from Read more`() {
        showing(Destination.Today, town = caughtUpWithTheNewestText)

        waitedForLink(newestText.title).performScrollTo().performClick()

        assertStackEndsWith(Destination.Today, Destination.SchoolText(newestText.id))
    }

    private fun showing(vararg destinations: Destination, town: TownSnapshot = townWithANewestText) {
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(town)) }
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
