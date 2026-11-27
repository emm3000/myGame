package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.navigation.MyGameRing
import com.emm.mygame.core.designsystem.navigation.MyGameTabHeader
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
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
    fun `sets a town title beside the ring on at most two lines or stacks the ring under it`() {
        drawHeader(title = MyGameLabel(text = TOWN_TITLE, translation = null), under = { Under() })

        val ring: DpRect = boundsOf(RING_NAME)
        val isBesideOnTwoLines: Boolean =
            titleLayout(TOWN_TITLE).lineCount <= 2 && ring.left >= boundsOf(TOWN_TITLE).right
        val isStacked: Boolean = ring.left.value < HALF_PIXEL && ring.top >= boundsOf(UNDER).bottom
        assertTrue("the title sits beside the ring on two lines at most, or stacks", isBesideOnTwoLines || isStacked)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `sets the line right under the title when the ring beside it takes three lines`() {
        drawHeader(
            title = MyGameLabel(text = TOWN_TITLE, translation = null),
            under = { Under() },
            ringName = LONG_RING_NAME,
        )

        val title: DpRect = boundsOf(TOWN_TITLE)
        val under: DpRect = boundsOf(UNDER)
        val ring: DpRect = boundsOf(LONG_RING_NAME)
        val header: DpRect = composeRule.onNodeWithTag(HEADER).getUnclippedBoundsInRoot()
        assertEquals(3, titleLayout(LONG_RING_NAME).lineCount)
        assertEquals(title.bottom.value, under.top.value, ONE_DP)
        assertEquals(maxOf(under.bottom, ring.bottom).value, header.bottom.value, ONE_DP)
    }

    @Test
    @Config(qualifiers = "w360dp-h640dp")
    fun `centers a ring of odd height on a title of even height to the pixel`() {
        composeRule.setContent {
            MyGameTheme {
                MyGameTabHeader(title = MyGameLabel(text = TITLE, translation = null), ring = { OddRing() })
            }
        }

        val title: Rect = pixelBoundsOf(composeRule.onNodeWithText(TITLE))
        val ring: Rect = pixelBoundsOf(composeRule.onNodeWithTag(RING))
        assertEquals(32f, title.height, 0f)
        assertEquals(21f, ring.height, 0f)
        assertEquals(0f, title.top, 0f)
        assertEquals(5f, ring.top, 0f)
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

    private fun drawHeader(title: MyGameLabel, under: @Composable () -> Unit = {}, ringName: String = RING_NAME) {
        composeRule.setContent {
            MyGameTheme {
                MyGameTabHeader(
                    title = title,
                    modifier = Modifier.testTag(HEADER),
                    ring = { Ring(name = ringName) },
                    under = under,
                )
            }
        }
    }

    private fun pixelBoundsOf(node: SemanticsNodeInteraction): Rect = node.fetchSemanticsNode().boundsInRoot

    @Composable
    private fun OddRing() {
        val side: Dp = with(LocalDensity.current) { ODD_RING_PIXELS.toDp() }
        Box(modifier = Modifier.size(side).testTag(RING))
    }

    private fun centerOf(bounds: DpRect): Float = (bounds.top.value + bounds.bottom.value) / 2

    private fun boundsOf(text: String): DpRect = composeRule.onNodeWithText(text).getUnclippedBoundsInRoot()

    @Composable
    private fun Ring(name: String) {
        MyGameRing(count = 0, total = 5, countBefore = 0, label = MyGameLabel(text = name, translation = null))
    }

    @Composable
    private fun Under() {
        MyGameText(text = UNDER, style = MyGameTypography.label, color = MyGameTheme.colors.ink)
    }

    private companion object {
        const val HALF_PIXEL: Float = 0.5f
        const val ONE_DP: Float = 1f
        const val HEADER: String = "header"
        const val RING: String = "ring"
        const val ODD_RING_PIXELS: Int = 21
        const val TITLE: String = "Aprender"
        const val TRANSLATION: String = "Learn"
        const val LONG_TITLE: String = "Saint Bartholomew of the Rivers · Pueblo"
        const val TOWN_TITLE: String = "Qaville · Pueblo"
        const val UNDER: String = "Noticias del pueblo"
        const val RING_NAME: String = "0 de 5 palabras aprendidas"
        const val LONG_RING_NAME: String = "12 de 40 palabras aprendidas"
    }
}
