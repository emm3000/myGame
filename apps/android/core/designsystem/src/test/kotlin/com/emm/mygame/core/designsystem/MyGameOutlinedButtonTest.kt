package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

private val ringRoom: Dp = 12.dp

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameOutlinedButtonTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var inputModes: InputModeManager? = null

    private fun showOnSurface(button: @Composable () -> Unit) {
        composeRule.setContent {
            inputModes = LocalInputModeManager.current
            MyGameTheme {
                Box(modifier = Modifier.background(MyGameTheme.colors.surface).padding(ringRoom)) { button() }
            }
        }
    }

    @Composable
    private fun BuildButton() {
        MyGameOutlinedButton(label = "Build the farm", isBusy = false, busyDescription = "Building", onClick = {})
    }

    @OptIn(ExperimentalComposeUiApi::class)
    private fun useKeyboard() {
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
    }

    private fun hexOf(pixel: Int): String = Integer.toHexString(pixel)

    private fun pixelsOfRoot(): PixelMap {
        val image: ImageBitmap = composeRule.onRoot().captureToImage()
        return image.toPixelMap()
    }

    @Test
    fun `an enabled outlined button draws its edge in ink at the control width`() {
        showOnSurface { BuildButton() }

        val pixels: PixelMap = pixelsOfRoot()
        val middle: Int = pixels.height / 2
        val outer: Int = with(composeRule.density) { ringRoom.roundToPx() }
        val inner: Int = with(composeRule.density) { (ringRoom + MyGameStrokeWidths.control).roundToPx() } - 1
        val ink: String = hexOf(lightColors.ink.toArgb())

        assertEquals("the edge's outer pixel", ink, hexOf(pixels[outer, middle].toArgb()))
        assertEquals("the edge's inner pixel", ink, hexOf(pixels[inner, middle].toArgb()))
    }

    @Test
    fun `the focus ring sits outside the outlined button's edge with a gap`() {
        showOnSurface { BuildButton() }
        useKeyboard()
        composeRule.onNodeWithTag(OUTLINED_PILL).requestFocus()

        val pixels: PixelMap = pixelsOfRoot()
        val middle: Int = pixels.height / 2
        val ringX: Int = with(composeRule.density) {
            (ringRoom - MyGameSpacing.step1 - MyGameStrokeWidths.focus / 2).roundToPx()
        }
        val gapX: Int = with(composeRule.density) { (ringRoom - MyGameSpacing.step1 / 2).roundToPx() }
        val focus: String = hexOf(lightColors.focus.toArgb())

        assertEquals("the ring", focus, hexOf(pixels[ringX, middle].toArgb()))
        assertNotEquals("the gap", focus, hexOf(pixels[gapX, middle].toArgb()))
    }
}
