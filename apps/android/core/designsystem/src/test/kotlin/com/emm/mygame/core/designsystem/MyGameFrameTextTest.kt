package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.click
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.intl.LocaleList
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
class MyGameFrameTextTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val taps: MutableList<Int> = mutableListOf()

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                content()
            }
        }
    }

    private fun showFrame(pieces: List<MyGameFramePiece>, openPiece: Int? = null) {
        show {
            MyGameFrameText(
                frame = MyGameFrame(pieces),
                openPiece = openPiece,
                style = MyGameTypography.reading,
                onPieceTap = { index: Int -> taps.add(index) },
            )
        }
    }

    private fun showBeside(pieces: List<MyGameFramePiece>, plain: String) {
        show {
            Column {
                MyGameFrameText(
                    frame = MyGameFrame(pieces),
                    openPiece = null,
                    style = MyGameTypography.reading,
                    onPieceTap = { index: Int -> taps.add(index) },
                )
                MyGameText(
                    text = plain,
                    style = MyGameTypography.reading,
                    color = MyGameTheme.colors.onBlock,
                    modifier = Modifier.testTag(PLAIN),
                )
            }
        }
    }

    private fun plainWidth(): Float = composeRule.onNodeWithTag(PLAIN).fetchSemanticsNode().boundsInRoot.width

    @Test
    fun `reads the whole frame as one sentence`() {
        showFrame(walkFrame(onTap))

        composeRule.onNodeWithText("The kids walk to school.").assertExists()
    }

    @Test
    fun `gives the screen reader the whole frame as one focusable sentence`() {
        showFrame(walkFrame(onTap))

        val sentence: SemanticsNode = composeRule.onNodeWithText("The kids walk to school.").fetchSemanticsNode()
        assertTrue(sentence.config.isMergingSemanticsOfDescendants)
    }

    @Test
    fun `keeps each word on tap its own focusable button inside the sentence`() {
        showFrame(walkFrame(onTap))

        val word: SemanticsNode = composeRule.onNode(hasText("walk") and hasClickAction()).fetchSemanticsNode()
        assertTrue(word.config.isMergingSemanticsOfDescendants)
        val sentence: String? = word.parent?.config?.getOrNull(SemanticsProperties.Text)?.joinToString()
        assertEquals("The kids walk to school.", sentence)
    }

    @Test
    fun `draws a piece without support as text no one can tap`() {
        showFrame(listOf(MyGameFramePiece(text = "Things like this go on.", support = null)))

        composeRule.onNodeWithText("Things like this go on.").assert(hasClickAction().not())
    }

    @Test
    fun `reads a support beside its word after the word`() {
        showFrame(walkFrame(beside))

        composeRule.onNodeWithText("The kids walk caminar to school.").assertExists()
    }

    @Test
    fun `draws a support beside its word`() {
        showFrame(walkFrame(beside))

        composeRule.onNodeWithTag(BESIDE_SUPPORT, useUnmergedTree = true).assertExists()
    }

    @Test
    fun `reads a support beside its word in the support's language`() {
        showFrame(walkFrame(beside))

        val text: AnnotatedString = composeRule.onNodeWithText("The kids walk caminar to school.").fetchSemanticsNode()
            .config[SemanticsProperties.Text].single()
        val spoken: AnnotatedString.Range<SpanStyle> = text.spanStyles.single()
        assertEquals("caminar", text.substring(spoken.start, spoken.end))
        assertEquals(LocaleList("es"), spoken.item.localeList)
    }

    @Test
    fun `opens no support line for a support already beside its word`() {
        assertEquals(null, MyGameFrame(walkFrame(beside)).openedSupportOf(1))
    }

    @Test
    fun `opens the support line of a word on tap`() {
        assertEquals(onTap, MyGameFrame(walkFrame(onTap)).openedSupportOf(1))
    }

    @Test
    fun `draws a support beside its word with no control`() {
        showFrame(walkFrame(beside))

        composeRule.onNodeWithText("The kids walk caminar to school.").assertExists()
        composeRule.onAllNodes(hasClickAction()).assertCountEquals(0)
    }

    @Test
    fun `gives a word on tap a control-tall target`() {
        showFrame(dayFrame)

        composeRule.onNodeWithText("day").assertHeightIsAtLeast(MyGameSizes.control)
    }

    @Test
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `gives a short word on tap a control-wide target`() {
        showFrame(dayFrame)
        val edge: Float = with(composeRule.density) { MyGameSizes.control.toPx() / 2 - 1 }

        composeRule.onNodeWithText("day").performTouchInput { click(Offset(centerX - edge, centerY)) }
        composeRule.onNodeWithText("day").performTouchInput { click(Offset(centerX + edge, centerY)) }

        assertEquals(listOf(1, 1), taps)
    }

    @Test
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `gives a two-letter word on tap a control-wide target`() {
        showFrame(goFrame)
        val edge: Float = with(composeRule.density) { MyGameSizes.control.toPx() / 2 - 1 }

        composeRule.onNodeWithText("go").performTouchInput { click(Offset(centerX - edge, centerY)) }
        composeRule.onNodeWithText("go").performTouchInput { click(Offset(centerX + edge, centerY)) }

        assertEquals(listOf(1, 1), taps)
    }

    @Test
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `measures a word on tap as wide as its text`() {
        showBeside(dayFrame, plain = "day")

        val word: Rect = composeRule.onNode(hasText("day") and hasClickAction()).fetchSemanticsNode().boundsInRoot
        assertEquals(plainWidth(), word.width, 0.5f)
    }

    @Test
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `sets a short word on tap one plain space after its neighbor`() {
        showBeside(dayFrame, plain = "The ")

        val word: Rect = composeRule.onNode(hasText("day") and hasClickAction().not(), useUnmergedTree = true)
            .fetchSemanticsNode().boundsInRoot
        val frame: Rect = composeRule.onNodeWithText("The day is ____.").fetchSemanticsNode().boundsInRoot
        assertEquals(plainWidth(), word.left - frame.left, 1f)
    }

    @OptIn(ExperimentalComposeUiApi::class)
    @Test
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `draws a focused word's ring outside its letters`() {
        var inputModes: InputModeManager? = null
        var ink: Color = Color.Unspecified
        composeRule.setContent {
            inputModes = LocalInputModeManager.current
            MyGameTheme {
                ink = MyGameTheme.colors.onBlock
                MyGameFrameText(
                    frame = MyGameFrame(dayFrame),
                    openPiece = null,
                    style = MyGameTypography.reading,
                    onPieceTap = {},
                )
            }
        }
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
        val word: DpRect = composeRule.onNodeWithText("day").requestFocus().getBoundsInRoot()

        val pixels: PixelMap = composeRule.onRoot().captureToImage().toPixelMap()
        val ringX: Int = with(composeRule.density) { (word.left - MyGameStrokeWidths.focus).roundToPx() }
        val middle: Int = with(composeRule.density) { ((word.top + word.bottom) / 2).roundToPx() }
        assertEquals(Integer.toHexString(ink.toArgb()), Integer.toHexString(pixels[ringX, middle].toArgb()))
    }

    @Test
    fun `announces a word on tap as a button`() {
        showFrame(walkFrame(onTap))

        composeRule.onNodeWithText("walk").assert(SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Button))
    }

    @Test
    fun `sends the tapped piece once`() {
        showFrame(walkFrame(onTap))

        composeRule.onNodeWithText("walk").performClick()

        assertEquals(listOf(1), taps)
    }

    @Test
    fun `marks the open word as selected`() {
        showFrame(walkFrame(onTap), openPiece = 1)

        composeRule.onNodeWithText("walk").assert(SemanticsMatcher.expectValue(SemanticsProperties.Selected, true))
    }

    @Test
    fun `keeps every word on tap apart at phone width`() {
        show {
            MyGameFrameText(
                frame = MyGameFrame(longFrame),
                openPiece = null,
                style = MyGameTypography.reading,
                onPieceTap = {},
                modifier = Modifier.width(PHONE_WIDTH),
            )
        }

        val targets: List<Rect> = composeRule.onAllNodes(hasClickAction()).fetchSemanticsNodes()
            .map { node: SemanticsNode -> node.boundsInRoot }
        assertEquals(longFrame.count { piece: MyGameFramePiece -> piece.support?.isOnTap == true }, targets.size)
        targets.forEachIndexed { index: Int, target: Rect ->
            targets.drop(index + 1).forEach { other: Rect ->
                assertTrue("$target overlaps $other", !target.overlaps(other))
            }
        }
    }

    @Test
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `sends a tap between two words on tap to the nearer word`() {
        showFrame(twoWordsFrame)
        val go: Rect = composeRule.onNodeWithText("go").fetchSemanticsNode().boundsInRoot
        val up: Rect = composeRule.onNodeWithText("up").fetchSemanticsNode().boundsInRoot
        val quarterGap: Float = (up.left - go.right) / 4

        composeRule.onRoot().performTouchInput { click(Offset(go.right + quarterGap, go.center.y)) }
        composeRule.onRoot().performTouchInput { click(Offset(up.left - quarterGap, up.center.y)) }

        assertEquals(listOf(0, 2), taps)
    }

    @Test
    fun `reads the support line in the support's language`() {
        show { MyGameSupportLine(support = onTap) }

        val text: AnnotatedString = composeRule.onNodeWithText("to go on foot").fetchSemanticsNode()
            .config[SemanticsProperties.Text].single()
        assertEquals(LocaleList("en"), text.spanStyles.single().item.localeList)
    }

    @Test
    fun `announces the support line when it shows`() {
        show { MyGameSupportLine(support = onTap) }

        val node: SemanticsNode = composeRule.onNodeWithText("to go on foot").fetchSemanticsNode()
        assertEquals(LiveRegionMode.Polite, node.config.getOrNull(SemanticsProperties.LiveRegion))
    }

    @Test
    fun `offers no tap on the support line`() {
        show { MyGameSupportLine(support = onTap) }

        val node: SemanticsNode = composeRule.onNodeWithText("to go on foot").fetchSemanticsNode()
        assertEquals(null, node.config.getOrNull(SemanticsActions.OnClick))
    }

    private companion object {
        val PHONE_WIDTH: Dp = 360.dp
        const val PLAIN: String = "plain"
        val beside: MyGameWordSupport = MyGameWordSupport(isOnTap = false, text = "caminar", languageTag = "es")
        val onTap: MyGameWordSupport = MyGameWordSupport(isOnTap = true, text = "to go on foot", languageTag = "en")

        fun walkFrame(support: MyGameWordSupport): List<MyGameFramePiece> = listOf(
            MyGameFramePiece(text = "The kids ", support = null),
            MyGameFramePiece(text = "walk", support = support),
            MyGameFramePiece(text = " to school.", support = null),
        )

        val dayFrame: List<MyGameFramePiece> = listOf(
            MyGameFramePiece(text = "The ", support = null),
            MyGameFramePiece(text = "day", support = onTap),
            MyGameFramePiece(text = " is ____.", support = null),
        )

        val goFrame: List<MyGameFramePiece> = listOf(
            MyGameFramePiece(text = "We ", support = null),
            MyGameFramePiece(text = "go", support = onTap),
            MyGameFramePiece(text = " home.", support = null),
        )

        val twoWordsFrame: List<MyGameFramePiece> = listOf(
            MyGameFramePiece(text = "go", support = onTap),
            MyGameFramePiece(text = " ", support = null),
            MyGameFramePiece(text = "up", support = onTap),
        )

        val longFrame: List<MyGameFramePiece> = listOf(
            MyGameFramePiece(text = "We ", support = null),
            MyGameFramePiece(text = "go", support = onTap),
            MyGameFramePiece(text = " to ", support = null),
            MyGameFramePiece(text = "work", support = onTap),
            MyGameFramePiece(text = " in a ", support = null),
            MyGameFramePiece(text = "truck", support = onTap),
            MyGameFramePiece(text = " at the ", support = null),
            MyGameFramePiece(text = "end", support = onTap),
            MyGameFramePiece(text = " of a ", support = null),
            MyGameFramePiece(text = "long", support = onTap),
            MyGameFramePiece(text = " day, and we ", support = null),
            MyGameFramePiece(text = "eat", support = onTap),
            MyGameFramePiece(text = " at ", support = null),
            MyGameFramePiece(text = "home", support = onTap),
            MyGameFramePiece(text = ".", support = null),
        )
    }
}
