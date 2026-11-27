package com.emm.mygame.core.designsystem

import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.control.MyGameChoiceLook
import com.emm.mygame.core.designsystem.control.MyGameChoiceRow
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.lightColors
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

private const val DP_TOLERANCE: Float = 1f

@RunWith(RobolectricTestRunner::class)
class MyGameChoiceRowTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun show(look: MyGameChoiceLook, isEnabled: Boolean = true) {
        composeRule.setContent {
            MyGameTheme {
                MyGameChoiceRow(label = "Spanish", isChosen = true, isEnabled = isEnabled, onClick = {}, look = look)
            }
        }
    }

    private fun labelPixels(): Set<Int> {
        val pixels: PixelMap = composeRule
            .onNodeWithText("Spanish", useUnmergedTree = true)
            .captureToImage()
            .toPixelMap()
        return (0 until pixels.width)
            .flatMap { x: Int -> (0 until pixels.height).map { y: Int -> pixels[x, y].toArgb() } }
            .toSet()
    }

    @Test
    fun `keeps a setting choice row at least 56 dp tall`() {
        show(MyGameChoiceLook.Setting)

        composeRule
            .onNode(isSelectable() and hasText("Spanish"))
            .assertHeightIsAtLeast(MyGameSizes.control + MyGameSpacing.step2)
    }

    @Test
    fun `pads a setting choice row above and below its label`() {
        show(MyGameChoiceLook.Setting)

        val row: DpRect = composeRule.onNode(isSelectable() and hasText("Spanish")).getBoundsInRoot()
        val label: DpRect = composeRule.onNodeWithText("Spanish", useUnmergedTree = true).getBoundsInRoot()

        assertEquals((row.top - label.top).value, (label.bottom - row.bottom).value, DP_TOLERANCE)
        assertEquals(true, label.top - row.top >= MyGameSpacing.step2)
    }

    @Test
    fun `keeps an answer choice row at the secondary height`() {
        show(MyGameChoiceLook.Answer)

        composeRule.onNode(isSelectable() and hasText("Spanish")).assertHeightIsAtLeast(MyGameSizes.secondary)
    }

    @Test
    fun `draws a disabled row's label in muted ink`() {
        show(MyGameChoiceLook.Setting, isEnabled = false)

        val pixels: Set<Int> = labelPixels()

        assertEquals("a muted ink pixel", true, lightColors.inkMuted.toArgb() in pixels)
        assertEquals("no ink pixel", false, lightColors.ink.toArgb() in pixels)
    }

    @Test
    fun `draws an enabled row's label in ink`() {
        show(MyGameChoiceLook.Setting)

        assertEquals("an ink pixel", true, lightColors.ink.toArgb() in labelPixels())
    }

    @Test
    fun `still draws a disabled chosen row's dot`() {
        show(MyGameChoiceLook.Setting, isEnabled = false)

        val pixels: PixelMap = composeRule.onNode(isSelectable() and hasText("Spanish")).captureToImage().toPixelMap()
        val dotX: Int = with(composeRule.density) { (MyGameSpacing.step3 + MyGameSizes.iconSmall / 2).roundToPx() }

        assertEquals("the dot's center", lightColors.action.toArgb(), pixels[dotX, pixels.height / 2].toArgb())
    }
}
