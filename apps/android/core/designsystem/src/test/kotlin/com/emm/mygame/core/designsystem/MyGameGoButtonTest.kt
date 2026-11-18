package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.Composable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsFocused
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.text.AnnotatedString
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

private val ringRoom: Dp = 12.dp

private const val START_REVIEWS: String = "Start the reviews"

private const val NO_REVIEWS_DUE: String = "No reviews due now."

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameGoButtonTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var inputModes: InputModeManager? = null

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            inputModes = LocalInputModeManager.current
            MyGameTheme {
                content()
            }
        }
    }

    @Composable
    private fun BlockedGoButton(onClick: () -> Unit) {
        MyGameButton(
            label = START_REVIEWS,
            isBusy = false,
            busyDescription = "Waiting",
            onClick = onClick,
            blockedReason = NO_REVIEWS_DUE,
        )
    }

    @OptIn(ExperimentalComposeUiApi::class)
    private fun useKeyboard() {
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
    }

    private fun pixelsOf(image: ImageBitmap): IntArray {
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)
        return pixels
    }

    private fun hexOf(pixel: Int): String = Integer.toHexString(pixel)

    private fun mostDrawnOf(pixels: IntArray): Int =
        pixels.toList().groupingBy { pixel: Int -> pixel }.eachCount().maxBy { it.value }.key

    @Test
    fun `the go button draws go with on-go`() {
        show { MyGameButton(label = "Start the reviews", isBusy = false, busyDescription = "Waiting", onClick = {}) }

        val pixels: IntArray = pixelsOf(composeRule.onNodeWithTag(INK_PILL).captureToImage())

        assertEquals(hexOf(lightColors.go.toArgb()), hexOf(mostDrawnOf(pixels)))
        assertTrue("the label is drawn in on-go", pixels.contains(lightColors.onGo.toArgb()))
    }

    @Test
    fun `a blocked go button stays focusable and reads its reason`() {
        show { BlockedGoButton(onClick = {}) }
        useKeyboard()

        composeRule
            .onNodeWithTag(INK_PILL)
            .assertIsEnabled()
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, NO_REVIEWS_DUE))
            .requestFocus()
            .assertIsFocused()
    }

    @Test
    fun `a blocked go button still hands its tap to the caller`() {
        var taps: Int = 0
        show { BlockedGoButton(onClick = { taps += 1 }) }

        composeRule.onNodeWithTag(INK_PILL).assert(hasClickAction()).performClick()

        assertEquals(1, taps)
    }

    @Test
    fun `the go button's count is go on an on-go disc`() {
        show {
            MyGameButton(label = START_REVIEWS, isBusy = false, busyDescription = "Waiting", onClick = {}, badge = "4")
        }

        val badge: IntArray = pixelsOf(
            composeRule.onNode(SemanticsMatcher.keyIsDefined(PILL_BADGE), useUnmergedTree = true).captureToImage(),
        )

        assertEquals(hexOf(lightColors.onGo.toArgb()), hexOf(mostDrawnOf(badge)))
        assertTrue("the figure is drawn in go", badge.contains(lightColors.go.toArgb()))
    }

    @Test
    fun `the count's disc is hidden from TalkBack`() {
        show {
            MyGameButton(
                label = "Start the reviews",
                isBusy = false,
                busyDescription = "Waiting",
                onClick = {},
                badge = "4",
            )
        }

        composeRule
            .onNodeWithTag(INK_PILL)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.Text, listOf(AnnotatedString(START_REVIEWS))))
            .assert(SemanticsMatcher.keyNotDefined(SemanticsProperties.ContentDescription))
    }

    @Test
    fun `the focus ring sits outside the go button's edge with a gap`() {
        show {
            Box(modifier = Modifier.background(MyGameTheme.colors.surfaceRaised).padding(ringRoom)) {
                MyGameButton(label = "Start the reviews", isBusy = false, busyDescription = "Waiting", onClick = {})
            }
        }
        useKeyboard()
        composeRule.onNodeWithTag(INK_PILL).requestFocus()

        val image: ImageBitmap = composeRule.onRoot().captureToImage()
        val middle: Int = image.height / 2
        val ringX: Int = with(composeRule.density) {
            (ringRoom - MyGameSpacing.step1 - MyGameStrokeWidths.focus / 2).roundToPx()
        }
        val edgeX: Int = with(composeRule.density) { (ringRoom + MyGameStrokeWidths.hairline).roundToPx() }

        assertEquals("the ring", hexOf(lightColors.focus.toArgb()), hexOf(image.toPixelMap()[ringX, middle].toArgb()))
        val edge: Int = image.toPixelMap()[edgeX, middle].toArgb()
        assertNotEquals("no ring on the green", hexOf(lightColors.focus.toArgb()), hexOf(edge))
    }
}
