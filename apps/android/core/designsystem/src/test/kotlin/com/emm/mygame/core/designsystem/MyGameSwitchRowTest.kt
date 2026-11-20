package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import org.robolectric.annotation.GraphicsMode
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
@GraphicsMode(GraphicsMode.Mode.NATIVE)
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

    @Test
    fun `the switch row draws a hairline line-strong outline`() {
        show {
            Box(modifier = Modifier.background(MyGameTheme.colors.surface).padding(rowRoom)) {
                MyGameSwitchRow(label = "Study reminder", isChecked = false, onCheckedChange = {})
            }
        }

        val pixels: PixelMap = composeRule.onRoot().captureToImage().toPixelMap()
        val middle: Int = pixels.height / 2
        val edge: Int = with(composeRule.density) { rowRoom.roundToPx() }
        val inside: Int = with(composeRule.density) { (rowRoom + MyGameStrokeWidths.hairline).roundToPx() }

        assertEquals("the edge", hexOf(lightColors.lineStrong), hexOf(pixels[edge, middle]))
        assertEquals("inside the hairline", hexOf(lightColors.surface), hexOf(pixels[inside, middle]))
    }
}

private val rowRoom: Dp = 12.dp

private fun hexOf(color: Color): String = Integer.toHexString(color.toArgb())
