package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.DpRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class MyGameTabHeaderTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `sets the ring at the end of the title's row`() {
        drawHeader(title = MyGameLabel(text = TITLE, translation = null))

        val title: DpRect = boundsOf(TITLE)
        val ring: DpRect = boundsOf(RING_NAME)
        assertEquals(360f, ring.right.value, HALF_PIXEL)
        assertEquals(centerOf(title), centerOf(ring), HALF_PIXEL)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `stacks the ring under a title that would take three lines beside it`() {
        drawHeader(title = MyGameLabel(text = LONG_TITLE, translation = null))

        val ring: DpRect = boundsOf(RING_NAME)
        assertEquals(0f, ring.left.value, HALF_PIXEL)
        assertTrue("the ring sits under the title", ring.top >= boundsOf(LONG_TITLE).bottom)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `sets the line under the title on the title's side`() {
        drawHeader(title = MyGameLabel(text = TITLE, translation = null), under = { Under() })

        val title: DpRect = boundsOf(TITLE)
        val under: DpRect = boundsOf(UNDER)
        assertEquals(title.left, under.left)
        assertTrue("the line sits under the title", under.top >= title.bottom)
        assertTrue("the line ends before the ring", under.right <= boundsOf(RING_NAME).left)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp", fontScale = 2.0f)
    fun `stacks the ring under the title and its line when a word would break beside it`() {
        drawHeader(title = MyGameLabel(text = TITLE, translation = null), under = { Under() })

        val ring: DpRect = boundsOf(RING_NAME)
        assertEquals(0f, ring.left.value, HALF_PIXEL)
        assertTrue("the ring sits under the line", ring.top >= boundsOf(UNDER).bottom)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `gives the title its width before the ring's line`() {
        drawHeader(title = MyGameLabel(text = TOWN_TITLE, translation = null), under = { Under() })

        assertEquals(1, titleLayout(TOWN_TITLE).lineCount)
        assertTrue("the ring ends the title's row", boundsOf(RING_NAME).left >= boundsOf(TOWN_TITLE).right)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp", fontScale = 2.0f)
    fun `wraps a town title over at most two lines beside the ring`() {
        drawHeader(title = MyGameLabel(text = TOWN_TITLE, translation = null), under = { Under() })

        assertTrue("the title takes at most two lines", titleLayout(TOWN_TITLE).lineCount <= 2)
        assertTrue("the ring ends the title's row", boundsOf(RING_NAME).left >= boundsOf(TOWN_TITLE).right)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `reads a translated title as one heading`() {
        drawHeader(title = MyGameLabel(text = TITLE, translation = TRANSLATION))

        composeRule.onAllNodes(isHeading()).assertCountEquals(1)
        composeRule.onAllNodes(isHeading() and hasText(TITLE) and hasText(TRANSLATION)).assertCountEquals(1)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `draws the title in the headline style`() {
        drawHeader(title = MyGameLabel(text = TITLE, translation = null))

        val layout: TextLayoutResult = titleLayout(TITLE)
        assertEquals(MyGameTypography.headline.fontSize, layout.layoutInput.style.fontSize)
        assertEquals(MyGameTypography.headline.fontWeight, layout.layoutInput.style.fontWeight)
    }

    private fun titleLayout(text: String): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult]
            .action
            ?.invoke(layouts)
        return layouts.single()
    }

    private fun drawHeader(title: MyGameLabel, under: @Composable () -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                MyGameTabHeader(title = title, ring = { Ring() }, under = under)
            }
        }
    }

    private fun centerOf(bounds: DpRect): Float = (bounds.top.value + bounds.bottom.value) / 2

    private fun boundsOf(text: String): DpRect = composeRule.onNodeWithText(text).getUnclippedBoundsInRoot()

    @Composable
    private fun Ring() {
        MyGameRing(count = 0, total = 5, countBefore = 0, label = MyGameLabel(text = RING_NAME, translation = null))
    }

    @Composable
    private fun Under() {
        MyGameText(text = UNDER, style = MyGameTypography.label, color = MyGameTheme.colors.ink)
    }

    private companion object {
        const val HALF_PIXEL: Float = 0.5f
        const val TITLE: String = "Aprender"
        const val TRANSLATION: String = "Learn"
        const val LONG_TITLE: String = "Saint Bartholomew of the Rivers · Pueblo"
        const val TOWN_TITLE: String = "Qaville · Pueblo"
        const val UNDER: String = "Noticias del pueblo"
        const val RING_NAME: String = "0 de 5 palabras aprendidas"
    }
}
