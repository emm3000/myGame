package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.AndroidComposeTestRule
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.rules.ActivityScenarioRule
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignUpResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.navigation.AppNavigation
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.koin.compose.KoinIsolatedContext
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SignUpNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val app: FakeAppGraph = FakeAppGraph(fakePortBindings(sessions = sessions, towns = towns))

    @Test
    fun `opens Name your town after sign-up`() {
        sessions.answerRestore(RestoreResult.SignedOut)
        sessions.answerSignUp(
            SignUpResult.SignedIn(
                SignedInPlayer("elena@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
            ),
        )
        repeat(READS_AVAILABLE) { towns.answerRead(TownReadResult.NoTown) }
        composeRule.setContent {
            MyGameTheme {
                KoinIsolatedContext(context = app.graph) {
                    AppNavigation(dependencies = app, reminderTaps = emptyFlow(), mailedLinks = emptyFlow())
                }
            }
        }
        waitForLine("Crea tu cuenta")
        composeRule.onNodeWithText("Crea tu cuenta").performScrollTo().performClick()
        waitForLine("Crear cuenta")

        textField("Correo").performTextInput("elena@example.com")
        textField("Contraseña").performTextInput("hierro-y-lana")
        composeRule.onNodeWithText("Crear cuenta").performScrollTo().performClick()

        waitForLine("Ponle nombre a tu pueblo")
    }

    private fun textField(label: String): SemanticsNodeInteraction =
        composeRule.onNode(hasSetTextAction() and hasContentDescription(label))

    private fun waitForLine(line: String) {
        composeRule.waitUntil(WAIT_MILLIS) {
            composeRule.onAllNodes(hasText(line)).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private companion object {
        const val READS_AVAILABLE: Int = 5
        const val WAIT_MILLIS: Long = 5_000
    }
}
