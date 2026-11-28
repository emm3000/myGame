package com.emm.mygame

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.SemanticsMatcher
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
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.account.PasswordResetToken
import com.emm.mygame.navigation.AppNavigation
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.koin.compose.KoinIsolatedContext
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ResetPasswordNavigationTest {

    @get:Rule
    val composeRule: AndroidComposeTestRule<ActivityScenarioRule<ComponentActivity>, ComponentActivity> =
        createAndroidComposeRule<ComponentActivity>()

    private val mailedLink: Destination.ResetPassword =
        Destination.ResetPassword(PasswordResetToken("rbi-I29wMEaqgA12gHRHjVk7zceeOXQn"))

    private val app: FakeAppGraph = FakeAppGraph()

    private var shownStack: NavBackStack<NavKey>? = null

    @Test
    fun `opens sign-in in place of the new password screen from its sign-in link`() {
        composeRule.setContent {
            MyGameTheme {
                KoinIsolatedContext(context = app.graph) {
                    AppNavigation(
                        dependencies = app,
                        reminderTaps = emptyFlow(),
                        mailedLinks = emptyFlow(),
                        backStack = rememberNavBackStack(mailedLink).also { shown: NavBackStack<NavKey> ->
                            shownStack = shown
                        },
                    )
                }
            }
        }
        val signInLink: SemanticsMatcher = hasText(SIGN_IN_LINK).and(hasClickAction())
        composeRule.waitUntil(WAIT_MILLIS) { composeRule.onAllNodes(signInLink).fetchSemanticsNodes().isNotEmpty() }

        composeRule.onNode(signInLink).performScrollTo().performClick()

        composeRule.waitForIdle()
        assertEquals(listOf<NavKey>(Destination.SignIn(isSessionEnded = false)), shownStack.orEmpty().toList())
    }

    private companion object {
        const val SIGN_IN_LINK: String = "Entra en tu pueblo"
        const val WAIT_MILLIS: Long = 5_000
    }
}
