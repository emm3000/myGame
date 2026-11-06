package com.emm.mygame.feature.town

import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import kotlin.time.Clock
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

    private fun tapSignOutFromTheNamingForm() {
        towns.answerRead(TownReadResult.NoTown)
        composeRule.setContent {
            MyGameTheme {
                TownRoute(
                    towns = towns,
                    sessions = sessions,
                    clock = Clock.System,
                    onSchoolOpen = {},
                    onReportOpen = {},
                    onSigningOut = { signingOuts += 1 },
                    onSignedOut = { signedOuts += 1 },
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
}
