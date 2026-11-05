package com.emm.mygame.feature.school

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.LifecycleRegistry
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolRouteTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val screenOwner: ScreenOwner = ScreenOwner()

    private var noTownCount: Int = 0

    private fun showRoute() {
        composeRule.setContent {
            CompositionLocalProvider(LocalLifecycleOwner provides screenOwner) {
                MyGameTheme {
                    SchoolRoute(towns = towns, clock = Clock.System, onNoTown = { noTownCount += 1 })
                }
            }
        }
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        composeRule.waitForIdle()
    }

    private fun waitForLine(line: String) {
        composeRule.waitUntil { composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty() }
    }

    @Test
    fun `reads the town once on return from the background`() {
        towns.answerRead(TownReadResult.Read(townOf(schoolLevel = 1)))
        showRoute()
        waitForLine("Nivel 1")
        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.CREATED) }
        towns.answerRead(TownReadResult.Read(townOf(schoolLevel = 2)))

        composeRule.runOnIdle { screenOwner.move(Lifecycle.State.RESUMED) }
        waitForLine("Nivel 2")

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads nothing while the app stays in the foreground`() {
        towns.answerRead(TownReadResult.Read(townOf()))
        showRoute()
        waitForLine("Nivel 1")

        composeRule.onNodeWithText("Nivel 1").assertIsDisplayed()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `hands a town that is gone to the navigation`() {
        towns.answerRead(TownReadResult.NoTown)

        showRoute()
        composeRule.waitUntil { noTownCount == 1 }

        assertEquals(1, noTownCount)
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
