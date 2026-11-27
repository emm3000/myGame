package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.navigation3.runtime.NavBackStack
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNewsReadResult
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.townOf
import com.emm.mygame.navigation.AppNavigation
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Clock
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class TownGridNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

    private val fixedClock: Clock = object : Clock {
        override fun now(): Instant = readAt
    }

    private val towns: FakeTownRepository = FakeTownRepository()

    private val reports: FakeReportRepository = FakeReportRepository()

    private val dependencies: AppDependencies = dependenciesOf(clock = fixedClock, towns = towns, reports = reports)

    private var shownStack: NavBackStack<NavKey>? = null

    @Test
    fun `a card opens its place's page above Town`() {
        showing(Destination.Today, Destination.Town)

        waitedFor("Escuela").performScrollTo().performClick()

        assertStackIs(Destination.Today, Destination.Town, Destination.Place(TownBuildingKind.School))
    }

    @Test
    fun `Town News opens above Town from Town's header`() {
        reports.answerNews(TownNewsReadResult.Read(emptyList()))
        showing(Destination.Today, Destination.Town)

        waitedFor("Noticias del pueblo").performClick()

        assertStackIs(Destination.Today, Destination.Town, Destination.News)
    }

    @Test
    fun `a place's page returns to Town from its header's back link`() {
        showing(Destination.Today, Destination.Town, Destination.Place(TownBuildingKind.Farm))

        waitedFor("Pueblo").performClick()

        assertStackIs(Destination.Today, Destination.Town)
    }

    private fun showing(vararg destinations: Destination) {
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.Read(townOf(readAt))) }
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

    private fun waitedFor(label: String): SemanticsNodeInteraction {
        val door: SemanticsMatcher = hasText(label) and hasClickAction() and !isSelectable()
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(door).fetchSemanticsNodes().isNotEmpty() }
        return composeRule.onNode(door)
    }

    private fun assertStackIs(vararg destinations: Destination) {
        composeRule.waitForIdle()
        assertEquals(destinations.toList(), shownStack.orEmpty().toList())
    }

    private companion object {
        const val READS_AVAILABLE: Int = 6
        const val WAIT_MILLIS: Long = 5_000
    }
}
