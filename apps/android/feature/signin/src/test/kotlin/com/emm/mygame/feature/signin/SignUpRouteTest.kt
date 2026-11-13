package com.emm.mygame.feature.signin

import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.testing.FakeSessionRepository
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class SignUpRouteTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    @Config(qualifiers = "es-rMX")
    fun `preselects es on a Spanish phone`() {
        drawSignUp()

        option("Español: una traducción junto a cada palabra nueva").assertIsSelected()
    }

    @Test
    @Config(qualifiers = "en-rUS")
    fun `preselects none on an English phone`() {
        drawSignUp()

        option("None: everything in English, with English definitions").assertIsSelected()
    }

    private fun drawSignUp() {
        composeRule.setContent {
            MyGameTheme {
                SignUpRoute(sessions = FakeSessionRepository(), onSignedIn = {}, onSignInOpen = {})
            }
        }
    }

    private fun option(label: String): SemanticsNodeInteraction = composeRule.onNode(isSelectable() and hasText(label))
}
