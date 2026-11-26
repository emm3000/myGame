package com.emm.mygame.feature.town

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.hiringOf
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Clock
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class TownRouteTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val screenOwner: ScreenOwner = ScreenOwner()

    private fun showHome() {
        composeRule.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides screenOwner) {
                MyGameTheme {
                    TownRoute(
                        towns = towns,
                        clock = Clock.System,
                        navigation = TownNavigation(
                            onSchoolOpen = {},
                            onMapOpen = {},
                            onTextOpen = {},
                            onUnnamed = {},
                            onNamed = {},
                        ),
                    )
                }
            }
        }
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        composeRule.waitForIdle()
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil { composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
    }

    private fun hiringTownWith(delivered: Int): TownSnapshot {
        val now: Instant = Clock.System.now()
        val order: TownSnapshot.HiringOrder = TownSnapshot.HiringOrder(
            hire = TownHireKind.Worker,
            count = 3,
            delivered = delivered,
            secondsPerHire = 600,
            startedAt = now,
            endsAt = now + 30.minutes,
        )
        return townOf(hiring = hiringOf(order = order), nextStep = openingOn(TownBuildingKind.Office), readAt = now)
    }

    @Test
    fun `reads the delivered hires again on return from the background`() {
        towns.answerRead(TownReadResult.Read(hiringTownWith(delivered = 1)))
        showHome()
        waitForLine("1 de 3 contratados")
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.CREATED) }
        towns.answerRead(TownReadResult.Read(hiringTownWith(delivered = 2)))

        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        waitForLine("2 de 3 contratados")

        assertEquals(2, towns.readCount)
    }

    private class ScreenOwner : LifecycleOwner {

        private val registry: LifecycleRegistry = LifecycleRegistry.createUnsafe(this)

        override val lifecycle: Lifecycle
            get() = registry

        fun move(state: Lifecycle.State) {
            registry.currentState = state
        }
    }
}
