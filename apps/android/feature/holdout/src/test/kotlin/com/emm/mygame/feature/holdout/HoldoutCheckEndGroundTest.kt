package com.emm.mygame.feature.holdout

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import com.emm.mygame.core.designsystem.MyGameTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class HoldoutCheckEndGroundTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var sunken: Color = Color.Unspecified

    @Test
    fun `draws the done line on surface-sunken in the light theme`() {
        show(state = HoldoutCheckUiState.Answered, darkTheme = false)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(HOLDOUT_CHECK_END_CARD))
    }

    @Test
    fun `draws the skipped line on surface-sunken in the light theme`() {
        show(state = HoldoutCheckUiState.Skipped, darkTheme = false)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(HOLDOUT_CHECK_END_CARD))
    }

    @Test
    fun `draws the done line on surface-sunken in the dark theme`() {
        show(state = HoldoutCheckUiState.Answered, darkTheme = true)

        assertEquals(sunken.toArgb(), mostDrawnColorOf(HOLDOUT_CHECK_END_CARD))
    }

    private fun show(state: HoldoutCheckUiState, darkTheme: Boolean) {
        composeRule.setContent {
            MyGameTheme(darkTheme = darkTheme) {
                sunken = MyGameTheme.colors.surfaceSunken
                HoldoutCheckScreen(state = state, onIntent = {}, onDone = {})
            }
        }
    }

    private fun mostDrawnColorOf(tag: String): Int {
        val image: ImageBitmap = composeRule.onNodeWithTag(tag).captureToImage()
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)
        return pixels.toList()
            .groupingBy { pixel: Int -> pixel }
            .eachCount()
            .maxBy { entry: Map.Entry<Int, Int> -> entry.value }
            .key
    }
}
