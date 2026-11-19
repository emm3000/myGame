package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameBackLinkTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `draws the back link's chevron in ink`() {
        composeRule.setContent {
            MyGameTheme {
                Box(modifier = Modifier.background(MyGameTheme.colors.surface)) {
                    MyGameBackLink(label = "Town", isEnabled = true, onClick = {})
                }
            }
        }

        val image: ImageBitmap =
            composeRule.onNode(hasTestTag(BACK_LINK_CHEVRON), useUnmergedTree = true).captureToImage()
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)

        assertTrue("the chevron is drawn in ink", pixels.contains(lightColors.ink.toArgb()))
    }

    @Test
    fun `draws a disabled back link's chevron in muted ink`() {
        composeRule.setContent {
            MyGameTheme {
                Box(modifier = Modifier.background(MyGameTheme.colors.surface)) {
                    MyGameBackLink(label = "Town", isEnabled = false, onClick = {})
                }
            }
        }

        val image: ImageBitmap =
            composeRule.onNode(hasTestTag(BACK_LINK_CHEVRON), useUnmergedTree = true).captureToImage()
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)

        assertTrue("the chevron is drawn in muted ink", pixels.contains(lightColors.inkMuted.toArgb()))
        assertFalse("the chevron is not drawn in ink", pixels.contains(lightColors.ink.toArgb()))
    }
}
