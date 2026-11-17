package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.click
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MyGameSwitchRowTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val changes: MutableList<Boolean> = mutableListOf()

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                content()
            }
        }
    }

    @Test
    fun `the switch row toggles on a tap anywhere on the row`() {
        show {
            MyGameSwitchRow(
                label = "Study reminder",
                supportingText = "Once a day",
                isChecked = false,
                onCheckedChange = { checked: Boolean -> changes += checked },
            )
        }

        composeRule.onNodeWithText("Study reminder").performTouchInput { click(centerLeft) }
        composeRule.onNodeWithText("Study reminder").performTouchInput { click(centerRight) }

        assertEquals(listOf(true, true), changes)
    }

    @Test
    fun `the switch row announces its role and its state`() {
        show { MyGameSwitchRow(label = "Study reminder", isChecked = true, onCheckedChange = {}) }

        composeRule
            .onNodeWithText("Study reminder")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Switch))
            .assertIsOn()
    }

    @Test
    fun `a disabled switch row ignores taps`() {
        show {
            MyGameSwitchRow(
                label = "Study reminder",
                isChecked = false,
                isEnabled = false,
                onCheckedChange = { checked: Boolean -> changes += checked },
            )
        }

        composeRule.onNodeWithText("Study reminder").assertIsNotEnabled().performClick()

        assertEquals(emptyList<Boolean>(), changes)
    }
}
