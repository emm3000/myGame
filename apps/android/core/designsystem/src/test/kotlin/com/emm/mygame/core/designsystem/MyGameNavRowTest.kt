package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.assertWidthIsEqualTo
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.frame.HAIRLINE
import com.emm.mygame.core.designsystem.navigation.MyGameNavRow
import com.emm.mygame.core.designsystem.navigation.NAV_ROW_CHEVRON
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.lightColors
import com.github.takahirom.roborazzi.captureRoboImage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

private const val PRESS_SETTLE_MILLIS: Long = 500L

private val school: MyGameLabel = MyGameLabel(text = "Go to the school", translation = null)

@RunWith(RobolectricTestRunner::class)
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
        val aboveText: Int = with(composeRule.density) { (MyGameSpacing.step3 / 2).roundToPx() }
        val focus: String = Integer.toHexString(lightColors.focus.toArgb())

        assertEquals("the start side", focus, hexAt(image, ring, aboveText))
        assertEquals("the end side", focus, hexAt(image, image.width - 1 - ring, aboveText))
        assertEquals("the top side", focus, hexAt(image, image.width / 2, ring))
    }

    @OptIn(ExperimentalComposeUiApi::class)
    @Test
    fun `a focused pressed nav row keeps its press inside the ring's rounded corners`() {
        show {
            inputModes = LocalInputModeManager.current
            MyGameNavRow(title = school, onClick = {})
        }
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
        row().requestFocus()
        composeRule.waitForIdle()
        composeRule.mainClock.autoAdvance = false
        row().performTouchInput { down(center) }
        composeRule.mainClock.advanceTimeBy(PRESS_SETTLE_MILLIS)

        val image: ImageBitmap = row().captureToImage()
        val insideRing: Int = with(composeRule.density) { MyGameStrokeWidths.focus.roundToPx() } + 2
        val ground: String = Integer.toHexString(lightColors.surface.toArgb())

        assertEquals("the corner", ground, hexAt(image, 1, image.height - 2))
        assertNotEquals("the press inside the ring", ground, hexAt(image, image.width / 2, image.height - insideRing))
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
    fun `a nav row's chevron is an icon wide at font scale 1`() {
        show {
            CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, fontScale = 1f)) {
                MyGameNavRow(title = school, onClick = {})
            }
        }

        chevron().assertWidthIsEqualTo(MyGameSizes.icon)
    }

    @OptIn(ExperimentalComposeUiApi::class)
    @Test
    fun `a focused nav row sets its title a step inside the ring and keeps its outer width`() {
        show {
            inputModes = LocalInputModeManager.current
            MyGameNavRow(title = school, onClick = {})
        }
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
        row().requestFocus()

        val rowBounds: DpRect = row().getBoundsInRoot()
        val titleBounds: DpRect = boundsOf("Go to the school")

        assertEquals("the title's inset from the ring", MyGameSpacing.step2, titleBounds.left - rowBounds.left)
        val rootBounds: DpRect = composeRule.onRoot().getBoundsInRoot()
        assertEquals("the ring starts at the row's start", rootBounds.left, rowBounds.left)
        assertEquals("the ring ends at the row's end", rootBounds.right, rowBounds.right)
    }

    @OptIn(ExperimentalComposeUiApi::class)
    @Test
    fun `a focused nav row at font scale 2 sets its title at least 5 dp inside the ring's inner edge`() {
        show {
            inputModes = LocalInputModeManager.current
            CompositionLocalProvider(LocalDensity provides Density(LocalDensity.current.density, fontScale = 2f)) {
                MyGameNavRow(title = MyGameLabel(text = "Lesson 10", translation = "Lección 10"), onClick = {})
            }
        }
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
        row().requestFocus()

        val ringInnerEdge: Dp = row().getBoundsInRoot().left + MyGameStrokeWidths.focus
        val titleBounds: DpRect = boundsOf("Lesson 10")

        assertTrue(
            "the title starts at ${titleBounds.left}, the ring's inner edge at $ringInnerEdge",
            titleBounds.left - ringInnerEdge >= 5.dp,
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
        row().captureRoboImage()
    }

    @Test
    fun `a nav row ends on its chevron a step inside its bounds`() {
        showSchoolRow()

        val rowBounds: DpRect = row().getBoundsInRoot()
        val chevronBounds: DpRect = chevron().getBoundsInRoot()
        val titleBounds: DpRect =
            composeRule.onNodeWithText("Go to the school", useUnmergedTree = true).getBoundsInRoot()

        assertEquals(rowBounds.right - MyGameSpacing.step2, chevronBounds.right)
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
                body = AnnotatedString("Work and money"),
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

    private fun lineCountOf(text: String): Int {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(layouts)
        return layouts.single().lineCount
    }

    private fun showStudyingRowInsidePageGutters(title: String) {
        show {
            Box(modifier = Modifier.padding(horizontal = MyGameSpacing.step4)) {
                MyGameNavRow(
                    title = MyGameLabel(text = title, translation = null),
                    status = MyGameLabel(text = "En estudio", translation = null),
                    onClick = {},
                )
            }
        }
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `a nav row at font scale 2 wraps its status before it squeezes its title`() {
        showStudyingRowInsidePageGutters(title = "Lección 1")

        assertEquals("the title's lines", 1, lineCountOf("Lección 1"))
        assertEquals("the status's lines", 2, lineCountOf("En estudio"))
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `a nav row at font scale 2 keeps each status word whole beside a title too long for one line`() {
        showStudyingRowInsidePageGutters(title = "Lección 1 · Leer las palabras")

        val title: DpRect = boundsOf("Lección 1 · Leer las palabras")
        val status: DpRect = boundsOf("En estudio")

        assertEquals("the status's lines", 2, lineCountOf("En estudio"))
        assertTrue("the status follows the title", title.right <= status.left)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `a nav row at font scale 2 keeps half its text room for the title beside a status word wider than half`() {
        show {
            Box(modifier = Modifier.padding(horizontal = MyGameSpacing.step4)) {
                MyGameNavRow(
                    title = MyGameLabel(text = "Lección 1 · Leer las palabras", translation = null),
                    status = MyGameLabel(text = "Internacionalización", translation = null),
                    onClick = {},
                )
            }
        }

        val title: DpRect = boundsOf("Lección 1 · Leer las palabras")
        val textRoom: Dp = chevron().getBoundsInRoot().left - MyGameSpacing.step3 - title.left - MyGameSpacing.step3
        val titleWidth: Dp = title.right - title.left

        assertTrue("the title is $titleWidth of $textRoom", titleWidth >= textRoom / 2)
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
    fun `a nav row hangs the caller's tag on its caption alone`() {
        show {
            MyGameNavRow(
                title = MyGameLabel(text = "Lesson 2", translation = null),
                body = AnnotatedString("Work and money"),
                caption = MyGameLabel(text = "5 words", translation = null),
                captionTag = "lesson_size",
                onClick = {},
            )
        }

        val tagged: List<SemanticsNode> =
            composeRule.onAllNodes(hasTestTag("lesson_size"), useUnmergedTree = true).fetchSemanticsNodes()

        assertEquals(1, tagged.size)
        assertEquals("5 words", tagged.single().config[SemanticsProperties.Text].single().text)
    }

    @Test
    fun `a nav row's caption tag holds a translated caption's lines alone`() {
        show {
            MyGameNavRow(
                title = MyGameLabel(text = "Lesson 2", translation = "Lección 2"),
                status = MyGameLabel(text = "Studying", translation = "Estudiando"),
                body = AnnotatedString("Work and money"),
                caption = MyGameLabel(text = "5 words", translation = "5 palabras"),
                captionTag = "lesson_size",
                onClick = {},
            )
        }

        val underTag: SemanticsMatcher = hasTestTag("lesson_size") or hasAnyAncestor(hasTestTag("lesson_size"))
        val lines: List<String> = composeRule.onAllNodes(underTag, useUnmergedTree = true)
            .fetchSemanticsNodes()
            .flatMap { node: SemanticsNode -> node.config.getOrElse(SemanticsProperties.Text) { emptyList() } }
            .map { line: AnnotatedString -> line.text }

        assertEquals(listOf("5 words", "5 palabras"), lines)
    }

    @Test
    fun `a nav row given no caption tag tags nothing but its chevron and its hairline`() {
        showLessonRow()

        val tags: List<String> = composeRule.onAllNodes(hasAnyTestTag(), useUnmergedTree = true)
            .fetchSemanticsNodes()
            .map { node: SemanticsNode -> node.config[SemanticsProperties.TestTag] }

        assertEquals(listOf(NAV_ROW_CHEVRON, HAIRLINE), tags)
    }

    private fun hasAnyTestTag(): SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsProperties.TestTag)

    @Test
    fun `the forward icon mirrors the back icon on the 24 grid`() {
        val drawn: VectorPath = MyGameIcons.forward.root.single() as VectorPath

        assertEquals(PathParser().parsePathString("m9 6 6 6-6 6").toNodes(), drawn.pathData)
    }

    @Test
    fun `a nav row given no title line draws its title with no span`() {
        showSchoolRow()

        val title: AnnotatedString = composeRule.onNodeWithText("Go to the school", useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SemanticsProperties.Text]
            .single()
        assertEquals(emptyList<AnnotatedString.Range<SpanStyle>>(), title.spanStyles)
    }
}
