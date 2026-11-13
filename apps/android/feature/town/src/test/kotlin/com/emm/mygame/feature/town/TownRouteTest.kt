package com.emm.mygame.feature.town

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Clock
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownRouteTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private var signingOuts: Int = 0

    private var signedOuts: Int = 0

    private val holdoutCheckOpens: MutableList<Pair<PlacementBand, HoldoutCheckWeek>> = mutableListOf()

    private val screenOwner: ScreenOwner = ScreenOwner()

    private fun showHome() {
        composeRule.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides screenOwner) {
                MyGameTheme {
                    TownRoute(
                        towns = towns,
                        sessions = sessions,
                        clock = Clock.System,
                        navigation = TownNavigation(
                            onSchoolOpen = {},
                            onReportOpen = {},
                            onMapOpen = {},
                            onReviewsOpen = {},
                            onLessonOpen = {},
                            onHoldoutCheckOpen = { band: PlacementBand, week: HoldoutCheckWeek ->
                                holdoutCheckOpens += band to week
                            },
                            onSigningOut = {},
                            onSignedOut = {},
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
        return townOf(hiring = hiringOf(order = order), readAt = now)
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

    @Test
    fun `opens the due check the next step names`() {
        val dueCheck: NextStep = NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)
        towns.answerRead(TownReadResult.Read(townOf(nextStep = dueCheck, readAt = Clock.System.now())))
        showHome()
        waitForLine("Abrir la prueba")

        composeRule.onNode(hasText("Abrir la prueba")).performScrollTo().performClick()
        composeRule.waitForIdle()

        assertEquals(listOf(PlacementBand.Second to HoldoutCheckWeek.TwentyFourth), holdoutCheckOpens)
    }

    private fun tapSignOutFromTheNamingForm() {
        towns.answerRead(TownReadResult.NoTown)
        composeRule.setContent {
            MyGameTheme {
                TownRoute(
                    towns = towns,
                    sessions = sessions,
                    clock = Clock.System,
                    navigation = TownNavigation(
                        onSchoolOpen = {},
                        onReportOpen = {},
                        onMapOpen = {},
                        onReviewsOpen = {},
                        onLessonOpen = {},
                        onHoldoutCheckOpen = { _, _ -> },
                        onSigningOut = { signingOuts += 1 },
                        onSignedOut = { signedOuts += 1 },
                    ),
                )
            }
        }
        composeRule.waitUntil { composeRule.onAllNodes(hasText("Salir")).fetchSemanticsNodes().isNotEmpty() }
        composeRule.onNodeWithText("Salir").performScrollTo().performClick()
        composeRule.waitForIdle()
    }

    @Test
    fun `tells the navigation the session is ending`() {
        tapSignOutFromTheNamingForm()

        assertEquals(1, signingOuts)
    }

    @Test
    fun `keeps the player here until the session has ended`() {
        tapSignOutFromTheNamingForm()

        assertEquals(0, signedOuts)
    }

    @Test
    fun `tells the navigation the session has ended`() {
        tapSignOutFromTheNamingForm()

        sessions.answerSignOut()

        composeRule.waitUntil { signedOuts == 1 }
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
