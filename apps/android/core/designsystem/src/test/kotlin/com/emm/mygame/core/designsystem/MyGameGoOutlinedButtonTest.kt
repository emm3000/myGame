package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

private val ringRoom: Dp = 12.dp

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameGoOutlinedButtonTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `an outlined go button draws its edge in go at the control width`() {
        composeRule.setContent {
            MyGameTheme {
                Box(modifier = Modifier.background(MyGameTheme.colors.surface).padding(ringRoom)) {
                    MyGameGoOutlinedButton(
                        label = "Build for 50 money",
                        isBusy = false,
                        busyDescription = "Sending",
                        onClick = {},
                    )
                }
            }
        }

        val pixels: PixelMap = composeRule.onRoot().captureToImage().toPixelMap()
        val middle: Int = pixels.height / 2
        val outer: Int = with(composeRule.density) { ringRoom.roundToPx() }
        val inner: Int = with(composeRule.density) { (ringRoom + MyGameStrokeWidths.control).roundToPx() } - 1
        val go: String = Integer.toHexString(lightColors.go.toArgb())

        assertEquals("the edge's outer pixel", go, Integer.toHexString(pixels[outer, middle].toArgb()))
        assertEquals("the edge's inner pixel", go, Integer.toHexString(pixels[inner, middle].toArgb()))
    }

    @Test
    fun `an outlined go button is read by its accessible name when one is given`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameGoOutlinedButton(
                    label = "Send a team",
                    isBusy = false,
                    busyDescription = "Sending",
                    onClick = {},
                    accessibleName = "Send a team to site 2",
                )
            }
        }

        composeRule.onNodeWithContentDescription("Send a team to site 2").assertIsDisplayed()
    }
}
