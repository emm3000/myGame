package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.graphics.vector.VectorPath
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.DpRect
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

private val school: MyGameLabel = MyGameLabel(text = "Go to the school", translation = null)

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameNavRowTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var taps: Int = 0

    private var inputModes: InputModeManager? = null

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                Box(modifier = Modifier.background(MyGameTheme.colors.surface)) {
                    content()
                }
            }
        }
    }

    private fun showSchoolRow() {
        show { MyGameNavRow(title = school, onClick = { taps += 1 }) }
    }

    private fun row(): SemanticsNodeInteraction = composeRule.onNode(hasClickAction())

    private fun chevron(): SemanticsNodeInteraction =
        composeRule.onNode(hasTestTag(NAV_ROW_CHEVRON), useUnmergedTree = true)

    private fun hexAt(image: ImageBitmap, x: Int, y: Int): String =
        Integer.toHexString(image.toPixelMap()[x, y].toArgb())

    private fun pixelsOf(image: ImageBitmap): IntArray {
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)
        return pixels
    }

    @Test
    fun `a nav row is a button that hands its tap to the caller`() {
        showSchoolRow()

        row().assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button)).performClick()

        assertEquals(1, taps)
    }

    @OptIn(ExperimentalComposeUiApi::class)
    @Test
    fun `draws a ring in the focus color inside a focused nav row that a clipping parent keeps`() {
        show {
            inputModes = LocalInputModeManager.current
            Box(modifier = Modifier.clipToBounds()) {
                MyGameNavRow(title = school, onClick = {})
            }
        }
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
        row().requestFocus()

        val image: ImageBitmap = row().captureToImage()
        val ring: Int = with(composeRule.density) { (MyGameStrokeWidths.focus / 2).roundToPx() }
        val focus: String = Integer.toHexString(lightColors.focus.toArgb())

        assertEquals("the start side", focus, hexAt(image, ring, image.height / 2))
        assertEquals("the end side", focus, hexAt(image, image.width - 1 - ring, image.height / 2))
        assertEquals("the top side", focus, hexAt(image, image.width / 2, ring))
    }

    @Test
    fun `draws no ring inside a nav row at rest`() {
        show {
            Box(modifier = Modifier.clipToBounds()) {
                MyGameNavRow(title = school, onClick = {})
            }
        }

        val image: ImageBitmap = row().captureToImage()
        val ring: Int = with(composeRule.density) { (MyGameStrokeWidths.focus / 2).roundToPx() }
        val ground: String = Integer.toHexString(lightColors.surface.toArgb())

        assertEquals("the top side", ground, hexAt(image, image.width / 2, ring))
    }

    @Test
    fun `a nav row's chevron grows with the font scale`() {
        show {
            Column {
                CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, fontScale = 1f)) {
                    MyGameNavRow(title = school, onClick = {})
                }
                CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, fontScale = 2f)) {
                    MyGameNavRow(title = school, onClick = {})
                }
            }
        }

        val chevrons: List<SemanticsNode> =
            composeRule.onAllNodes(hasTestTag(NAV_ROW_CHEVRON), useUnmergedTree = true).fetchSemanticsNodes()
                .sortedBy { node: SemanticsNode -> node.positionInRoot.y }

        assertTrue(
            "${chevrons[1].size} is larger than ${chevrons[0].size}",
            chevrons[1].size.width > chevrons[0].size.width,
        )
    }

    @Test
    fun `a nav row of one line keeps the secondary height`() {
        showSchoolRow()

        row().assertHeightIsAtLeast(MyGameSizes.secondary)
    }

    @Test
    fun `a nav row draws no border`() {
        showSchoolRow()

        val image: ImageBitmap = row().captureToImage()
        val pixels: IntArray = pixelsOf(image)
        val ground: Int = lightColors.surface.toArgb()
        val topEdge: List<Int> = pixels.take(image.width)
        val bottomEdge: List<Int> = pixels.takeLast(image.width)

        assertTrue("the top edge is ground", topEdge.all { pixel: Int -> pixel == ground })
        assertTrue("the bottom edge is ground", bottomEdge.all { pixel: Int -> pixel == ground })
    }

    @Test
    fun `a nav row ends on its chevron`() {
        showSchoolRow()

        val rowBounds: DpRect = row().getBoundsInRoot()
        val chevronBounds: DpRect = chevron().getBoundsInRoot()
        val titleBounds: DpRect =
            composeRule.onNodeWithText("Go to the school", useUnmergedTree = true).getBoundsInRoot()

        assertEquals(rowBounds.right, chevronBounds.right)
        assertTrue("the chevron follows the title", titleBounds.right <= chevronBounds.left)
    }

    @Test
    fun `a nav row's chevron points forward in ink`() {
        showSchoolRow()

        val image: ImageBitmap = chevron().captureToImage()
        val pixels: IntArray = pixelsOf(image)
        val ground: Int = lightColors.surface.toArgb()
        val middle: Int = image.height / 2
        val inkedColumns: List<Int> = (0 until image.width).filter { x: Int ->
            pixels[middle * image.width + x] != ground
        }

        assertTrue("the chevron is drawn in ink", pixels.contains(lightColors.ink.toArgb()))
        assertTrue("its point is past the middle: $inkedColumns", inkedColumns.average() > image.width / 2.0)
    }

    private fun showLessonRow() {
        show {
            MyGameNavRow(
                title = MyGameLabel(text = "Lesson 2", translation = null),
                status = MyGameLabel(text = "Studying", translation = null),
                body = MyGameLabel(text = "Work and money", translation = null),
                caption = MyGameLabel(text = "5 words", translation = null),
                onClick = {},
            )
        }
    }

    private fun boundsOf(text: String): DpRect =
        composeRule.onNodeWithText(text, useUnmergedTree = true).getBoundsInRoot()

    @Test
    fun `a nav row draws its status beside its title`() {
        showLessonRow()

        val title: DpRect = boundsOf("Lesson 2")
        val status: DpRect = boundsOf("Studying")

        assertTrue("the status follows the title", title.right <= status.left)
        assertTrue("the status shares the title's line", status.top < title.bottom && title.top < status.bottom)
    }

    @Test
    fun `a nav row draws its body under its title`() {
        showLessonRow()

        assertTrue("the body is under the title", boundsOf("Lesson 2").bottom <= boundsOf("Work and money").top)
    }

    @Test
    fun `a nav row draws its caption under its body`() {
        showLessonRow()

        assertTrue("the caption is under the body", boundsOf("Work and money").bottom <= boundsOf("5 words").top)
    }

    @Test
    fun `the forward icon mirrors the back icon on the 24 grid`() {
        val drawn: VectorPath = MyGameIcons.forward.root.single() as VectorPath

        assertEquals(PathParser().parsePathString("m9 6 6 6-6 6").toNodes(), drawn.pathData)
    }
}
