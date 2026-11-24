package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.navigation.AppNavigation
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.flow.emptyFlow
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

    private val towns: FakeTownRepository = FakeTownRepository()

    private val dependencies: AppDependencies = dependenciesOf(clock = fixedClock, towns = towns)

    @Test
    fun `asks for the town's name when the school finds no town`() {
        repeat(NO_TOWN_READS) { towns.answerRead(TownReadResult.NoTown) }

        composeRule.setContent {
            MyGameTheme {
                AppNavigation(
                    dependencies = dependencies,
                    reminderTaps = emptyFlow(),
                    mailedLinks = emptyFlow(),
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
