package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameControlsTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var taps: Int = 0

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                content()
            }
        }
    }

    @Test
    fun `gives the back link control height`() {
        show { MyGameBackLink(label = "Town", isEnabled = true, onClick = {}) }

        composeRule.onNodeWithText("TOWN").assertHeightIsEqualTo(MyGameSizes.control)
    }

    @Test
    fun `gives a text link control height`() {
        show { MyGameTextLink(label = "Try again", onClick = {}) }

        composeRule.onNodeWithText("Try again").assertHeightIsEqualTo(MyGameSizes.control)
    }

    @Test
    fun `gives a text button control height`() {
        show { MyGameTextButton(label = "Sign out", isBusy = false, busyDescription = "Waiting", onClick = {}) }

        composeRule.onNodeWithText("Sign out").assertHeightIsEqualTo(MyGameSizes.control)
    }

    @Test
    fun `gives the ink pill action height`() {
        show { MyGameButton(label = "Study", isBusy = false, busyDescription = "Waiting", onClick = {}) }

        composeRule.onNodeWithTag(INK_PILL).assertHeightIsEqualTo(MyGameSizes.action)
    }

    @Test
    fun `gives an outlined pill secondary height`() {
        show { MyGameOutlinedButton(label = "School", isBusy = false, busyDescription = "Waiting", onClick = {}) }

        composeRule.onNodeWithTag(OUTLINED_PILL).assertHeightIsEqualTo(MyGameSizes.secondary)
    }

    @Test
    fun `reads a meta label to TalkBack in its original case`() {
        show { MyGameMetaText(text = "Riverton", color = MyGameTheme.colors.inkMuted) }

        composeRule.onNodeWithText("RIVERTON").assert(hasContentDescription("Riverton"))
    }

    @Test
    fun `refuses a tap on a disabled back link`() {
        show { MyGameBackLink(label = "Town", isEnabled = false, onClick = { taps += 1 }) }

        composeRule.onNodeWithText("TOWN").assertIsNotEnabled().performClick()

        assertEquals(0, taps)
    }

    @Test
    fun `refuses a tap on a busy text button and names the wait`() {
        show {
            MyGameTextButton(label = "Sign out", isBusy = true, busyDescription = "Waiting", onClick = { taps += 1 })
        }

        composeRule
            .onNodeWithText("Sign out")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Waiting"))
            .performClick()

        assertEquals(0, taps)
    }
}
