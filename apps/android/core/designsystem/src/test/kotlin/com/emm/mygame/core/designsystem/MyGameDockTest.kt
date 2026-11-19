package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.width
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private val dueReviews: MyGameDockLine =
    MyGameDockLine(title = MyGameLabel(text = "What is next", translation = null), step = plain("Reviews due: 4"))

private fun plain(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

private fun startTheReviews(onClick: () -> Unit = {}): MyGameDockGo =
    MyGameDockGo(label = plain("Start the reviews"), isBusy = false, busyDescription = "Waiting", onClick = onClick)

private fun studyTheReturningWords(): MyGameDockGo = MyGameDockGo(
    label = plain(STUDY_RETURNING),
    isBusy = false,
    busyDescription = "Esperando",
    onClick = {},
)

private const val STUDY_RETURNING: String = "Estudiar las palabras que vuelven"

private val returningWords: MyGameDockLine = MyGameDockLine(
    title = plain("Tu siguiente paso"),
    step = plain("Palabras que vuelven: banda 2, grupo 3"),
)

private val returningWordsInBoth: MyGameDockLine = MyGameDockLine(
    title = MyGameLabel(text = "What is next", translation = "Tu siguiente paso"),
    step = plain("Palabras que vuelven: banda 2, grupo 3"),
)

private val tallNotice: Dp = 300.dp

private val smallWindowHeight: Dp = 640.dp

private val isSilent: SemanticsMatcher = SemanticsMatcher.keyNotDefined(SemanticsProperties.LiveRegion)

private const val SKELETON_SHOWN_MILLIS: Long = 500L

private const val DP_TOLERANCE: Float = 0.5f

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class MyGameDockTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                content()
            }
        }
    }

    @Test
    fun `the go button's name is its label and the line`() {
        show { MyGameDock(line = dueReviews, go = startTheReviews(), onFoldChange = {}) }

        composeRule
            .onNodeWithTag(INK_PILL)
            .assert(
                SemanticsMatcher.expectValue(
                    SemanticsProperties.ContentDescription,
                    listOf("Start the reviews, Reviews due: 4"),
                ),
            )
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `the go button takes the sheet's whole width and no door beside it`() {
        show { MyGameDock(line = dueReviews, go = startTheReviews(), onFoldChange = {}) }

        val go: DpRect = composeRule.onNodeWithTag(INK_PILL).getBoundsInRoot()
        val sheet: DpRect = composeRule.onRoot().getBoundsInRoot()

        assertEquals(sheet.width.value - MyGameSpacing.step5.value * 2, go.width.value, DP_TOLERANCE)
        composeRule.onNodeWithTag(OUTLINED_PILL).assertDoesNotExist()
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `the dock folds to the go button past half the window`() {
        var folds: List<Boolean> = emptyList()
        show {
            MyGameDock(
                line = dueReviews,
                go = startTheReviews(),
                onFoldChange = { isFolded: Boolean -> folds = folds + isFolded },
                notice = { Spacer(modifier = Modifier.height(tallNotice)) },
            )
        }

        composeRule.onNodeWithTag(INK_PILL).assertIsDisplayed()
        composeRule.onNodeWithText("Reviews due: 4").assertDoesNotExist()
        assertEquals(listOf(true), folds)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `the folded go button keeps its whole label at font scale 2 on a 360 by 640 window`() {
        var isFolded: Boolean = false
        show {
            Box(contentAlignment = Alignment.BottomCenter, modifier = Modifier.fillMaxSize()) {
                MyGameDock(
                    line = returningWords,
                    go = studyTheReturningWords(),
                    onFoldChange = { folded: Boolean -> isFolded = folded },
                )
            }
        }

        val go: SemanticsNode = placedGoButton()
        val label: Rect = go.children.single().boundsInRoot
        assertTrue("the dock folded", isFolded)
        assertEquals("the go button grows to hold its label", go.boundsInRoot.bottom, label.bottom + step2Px(), 1f)
        val bottom: Dp = composeRule.onNodeWithTag(INK_PILL).getBoundsInRoot().bottom
        assertTrue("the go button is inside the window", bottom <= smallWindowHeight)
    }

    @Test
    @Config(qualifiers = "+w640dp-h360dp-land")
    fun `the dock folds in landscape at font scale 1`() {
        var isFolded: Boolean = false
        show {
            MyGameDock(
                line = returningWordsInBoth,
                go = studyTheReturningWords(),
                onFoldChange = { folded: Boolean -> isFolded = folded },
            )
        }

        composeRule.onNodeWithTag(INK_PILL).assertIsDisplayed()
        assertTrue("the dock folded", isFolded)
    }

    @Test
    fun `the line speaks when the step changes and not on the first draw`() {
        var line: MyGameDockLine by mutableStateOf(dueReviews)
        show { MyGameDock(line = line, go = startTheReviews(), onFoldChange = {}) }

        composeRule.onNodeWithText("Reviews due: 4").assert(isSilent)
        line = dueReviews.copy(step = plain("Reviews due: 4"))
        composeRule.onNodeWithText("Reviews due: 4").assert(isSilent)
        line = dueReviews.copy(step = plain("Reviews due: 3"))

        composeRule
            .onNodeWithText("Reviews due: 3")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun `the line stays silent when it first draws after loading`() {
        var line: MyGameDockLine by mutableStateOf(dueReviews.copy(step = null))
        show { MyGameDock(line = line, go = startTheReviews(), onFoldChange = {}) }

        line = dueReviews

        composeRule.onNodeWithText("Reviews due: 4").assert(isSilent)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `loading draws a skeleton line and a busy go button`() {
        show { MyGameDock(line = dueReviews.copy(step = null), go = startTheReviews(), onFoldChange = {}) }
        composeRule.mainClock.advanceTimeBy(SKELETON_SHOWN_MILLIS)

        assertTrue("the line is a skeleton", placedNodesWithTag(SKELETON_BLOCK).isNotEmpty())
        composeRule
            .onNodeWithTag(INK_PILL)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Waiting"))
            .assertIsNotEnabled()
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `loading animates one skeleton, never one in the measured copy`() {
        show { MyGameDock(line = dueReviews.copy(step = null), go = startTheReviews(), onFoldChange = {}) }
        composeRule.mainClock.advanceTimeBy(SKELETON_SHOWN_MILLIS)

        val skeletons: Int = composeRule
            .onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true)
            .fetchSemanticsNodes()
            .size

        assertEquals(1, skeletons)
    }

    @Test
    fun `the line drawn apart from the dock speaks when the step changes`() {
        var line: MyGameDockLine by mutableStateOf(dueReviews)
        show { MyGameDockLineText(line = line, loadingLabel = "Waiting") }

        line = dueReviews.copy(step = plain("Reviews due: 3"))

        composeRule
            .onNodeWithText("Reviews due: 3")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
    }

    @Test
    fun `the dock is a traversal group whose index the caller sets`() {
        show {
            MyGameDock(
                line = dueReviews,
                go = startTheReviews(),
                onFoldChange = {},
                modifier = Modifier.semantics { traversalIndex = -1f },
            )
        }

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.IsTraversalGroup, true))
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.TraversalIndex, -1f))
    }

    @Test
    fun `the dock's title is a heading`() {
        show { MyGameDock(line = dueReviews, go = startTheReviews(), onFoldChange = {}) }

        composeRule
            .onNode(hasContentDescription("What is next"))
            .assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading))
    }

    private fun placedNodesWithTag(tag: String): List<SemanticsNode> = composeRule
        .onAllNodesWithTag(tag, useUnmergedTree = true)
        .fetchSemanticsNodes()
        .filter { node: SemanticsNode -> node.layoutInfo.isPlaced }

    private fun placedGoButton(): SemanticsNode = placedNodesWithTag(INK_PILL).single()

    private fun step2Px(): Float = with(composeRule.density) { MyGameSpacing.step2.toPx() }
}
