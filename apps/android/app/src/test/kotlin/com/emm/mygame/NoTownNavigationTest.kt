package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.PlacementRepository
import com.emm.mygame.core.network.PlayerLanguage
import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.SessionEnds
import com.emm.mygame.core.network.SessionRepository
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class NoTownNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val fixedClock: Clock = object : Clock {
        override fun now(): Instant = Instant.parse("2026-11-05T10:00:00Z")
    }

    private val townsFake: FakeTownRepository = FakeTownRepository()

    private val dependencies: AppDependencies = object : AppDependencies {
        override val clock: Clock = fixedClock
        override val sessionEnds: SessionEnds = SessionEnds()
        override val playerLanguage: StateFlow<PlayerLanguage?> = MutableStateFlow(null)
        override val playerScaffold: StateFlow<PlayerScaffold?> = MutableStateFlow(null)
        override val sessions: SessionRepository = FakeSessionRepository()
        override val towns: TownRepository = townsFake
        override val learning: LearningRepository = FakeLearningRepository()
        override val reports: ReportRepository = FakeReportRepository()
        override val placements: PlacementRepository = FakePlacementRepository()
        override val holdoutChecks: HoldoutCheckRepository = FakeHoldoutCheckRepository()
    }

    @Test
    fun `asks for the town's name when the school finds no town`() {
        repeat(NO_TOWN_READS) { townsFake.answerRead(TownReadResult.NoTown) }

        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    backStack = rememberNavBackStack(Destination.Town, Destination.School),
                )
            }
        }

        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(NAMING_TITLE)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val NO_TOWN_READS: Int = 3
        const val NAMING_TITLE: String = "Ponle nombre a tu pueblo"
        const val WAIT_MILLIS: Long = 5_000
    }
}
