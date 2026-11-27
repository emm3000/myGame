package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameHeaderTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `keeps the ring and its label on the back link's row when both fit`() {
        drawHeader(end = { Ring() })

        val ring: DpRect = boundsOf(RING_NAME)
        val back: DpRect = boundsOf(BACK)
        assertEquals(360.dp, ring.right)
        assertEquals(back.top + back.bottom, ring.top + ring.bottom)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp", fontScale = 2.0f)
    fun `drops the ring and its label under the start side when they do not fit one row`() {
        drawHeader(end = { Ring() })

        val ring: DpRect = boundsOf(RING_NAME)
        assertEquals(0.dp, ring.left)
        assertTrue(ring.top >= boundsOf(BACK).bottom)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp", fontScale = 2.0f)
    fun `sets a dropped ring one step2 under the back link's row`() {
        drawHeader(end = { Ring() })

        val gap: Dp = boundsOf(RING_NAME).top - boundsOf(BACK).bottom
        assertEquals(MyGameSpacing.step2.value, gap.value, HALF_PIXEL)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp", fontScale = 2.0f)
    fun `never clips the label at font scale two`() {
        drawHeader(end = { Ring() })

        val label: DpRect = composeRule.onNodeWithText(RING_NAME, useUnmergedTree = true).getUnclippedBoundsInRoot()
        val header: DpRect = composeRule.onRoot().getUnclippedBoundsInRoot()
        assertFalse(labelLayout().hasVisualOverflow)
        assertTrue(label.right <= header.right && label.bottom <= header.bottom)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp", fontScale = 2.0f)
    fun `keeps the start row at the control height above a dropped ring`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameHeader(end = { Ring() }) {
                    MyGameText(text = BACK, style = MyGameTypography.caption, color = MyGameTheme.colors.inkMuted)
                }
            }
        }

        assertTrue(boundsOf(BACK).bottom < 48.dp)
        assertEquals(56.dp, boundsOf(RING_NAME).top)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp", fontScale = 2.0f)
    fun `leaves no room under a start side wider than the row when the ring is hidden`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameHeader {
                    MyGameText(text = LONG_NAME, style = MyGameTypography.title, color = MyGameTheme.colors.ink)
                }
            }
        }

        assertEquals(boundsOf(LONG_NAME).bottom, composeRule.onRoot().getUnclippedBoundsInRoot().bottom)
    }

    private fun drawHeader(end: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                MyGameHeader(end = end) {
                    MyGameBackLink(label = BACK, isEnabled = true, onClick = {})
                }
            }
        }
    }

    private fun boundsOf(text: String): DpRect = composeRule.onNodeWithText(text).getUnclippedBoundsInRoot()

    private fun labelLayout(): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(RING_NAME, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult]
            .action
            ?.invoke(layouts)
        return layouts.single()
    }

    @Composable
    private fun Ring() {
        MyGameRing(count = 12, total = 80, countBefore = 12, label = MyGameLabel(text = RING_NAME, translation = null))
    }

    private companion object {
        const val BACK: String = "Pueblo"
        const val HALF_PIXEL: Float = 0.5f
        const val RING_NAME: String = "12 de 80 palabras aprendidas"
        const val LONG_NAME: String = "Saint Bartholomew of the Seven Rivers and the Long Valley · Town"
    }
}
