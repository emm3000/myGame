package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.traversalIndex
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.width
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private fun plain(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

private val dueReviews: MyGameLabel = plain("Reviews due: 4")

private fun startTheReviews(onClick: () -> Unit = {}): MyGameDockGo =
    MyGameDockGo(label = plain("Start the reviews"), isBusy = false, busyDescription = MyGameLabel(text = "Waiting", translation = null), onClick = onClick)

private fun studyTheReturningWords(): MyGameDockGo = MyGameDockGo(
    label = plain(STUDY_RETURNING),
    isBusy = false,
    busyDescription = MyGameLabel(text = "Esperando", translation = null),
    onClick = {},
)

private const val STUDY_RETURNING: String = "Estudiar las palabras que vuelven"

private const val REFUSAL: String = "We could not reach your town. Try again."

private val returningWords: MyGameLabel = plain("Palabras que vuelven: banda 2, grupo 3")

private val tallNotice: Dp = 300.dp

private val smallWindowHeight: Dp = 640.dp

private val isLive: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion)

private val speaksPolitely: SemanticsMatcher =
    SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite)

private const val DP_TOLERANCE: Float = 0.5f

private const val REVEAL_MARGIN_MILLIS: Long = 100L

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
    fun `the go button's name is its label and the step`() {
        show { MyGameDock(go = startTheReviews(), step = dueReviews, onFoldChange = {}) }

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
    fun `the dock draws no line beside the go button`() {
        show { MyGameDock(go = startTheReviews(), step = dueReviews, onFoldChange = {}) }

        composeRule.onNodeWithText("Reviews due: 4", useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `the go button takes the sheet's whole width and no door beside it`() {
        show { MyGameDock(go = startTheReviews(), step = dueReviews, onFoldChange = {}) }

        val go: DpRect = composeRule.onNodeWithTag(INK_PILL).getBoundsInRoot()
        val sheet: DpRect = composeRule.onRoot().getBoundsInRoot()

        assertEquals(sheet.width.value - MyGameSpacing.step5.value * 2, go.width.value, DP_TOLERANCE)
        composeRule.onNodeWithTag(OUTLINED_PILL).assertDoesNotExist()
    }

    @Test
    @Config(qualifiers = "+w411dp-h915dp")
    fun `a refusal is drawn above the go button at font scale 1 on a 411 by 915 window`() {
        var folds: List<Boolean> = emptyList()
        show {
            MyGameDock(
                go = startTheReviews(),
                step = dueReviews,
                onFoldChange = { isFolded: Boolean -> folds = folds + isFolded },
                notice = { MyGameInlineAlert(message = REFUSAL) },
            )
        }

        val refusal: Rect = placedText(REFUSAL).single().boundsInRoot
        val go: Rect = placedGoButton().boundsInRoot
        assertTrue("the refusal sits above the go button", refusal.bottom <= go.top)
        assertEquals(listOf(false), folds)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `the notice folds out of the dock past half the window`() {
        var folds: List<Boolean> = emptyList()
        show {
            MyGameDock(
                go = startTheReviews(),
                step = dueReviews,
                onFoldChange = { isFolded: Boolean -> folds = folds + isFolded },
                notice = {
                    Box {
                        Spacer(modifier = Modifier.height(tallNotice))
                        MyGameInlineAlert(message = REFUSAL)
                    }
                },
            )
        }

        composeRule.onNodeWithTag(INK_PILL).assertIsDisplayed()
        assertEquals("a refusal drawn in the folded dock", emptyList<SemanticsNode>(), placedText(REFUSAL))
        assertEquals(listOf(true), folds)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `the go button keeps its whole label at font scale 2 on a 360 by 640 window`() {
        show {
            Box(contentAlignment = Alignment.BottomCenter, modifier = Modifier.fillMaxSize()) {
                MyGameDock(go = studyTheReturningWords(), step = returningWords, onFoldChange = {})
            }
        }

        val go: SemanticsNode = placedGoButton()
        val label: Rect = go.children.single().boundsInRoot
        assertEquals("the go button grows to hold its label", go.boundsInRoot.bottom, label.bottom + step2Px(), 1f)
        val bottom: Dp = composeRule.onNodeWithTag(INK_PILL).getBoundsInRoot().bottom
        assertTrue("the go button is inside the window", bottom <= smallWindowHeight)
    }

    @Test
    fun `the go button speaks when the step changes and not on the first draw`() {
        var step: MyGameLabel by mutableStateOf(dueReviews)
        show { MyGameDock(go = startTheReviews(), step = step, onFoldChange = {}) }

        composeRule.onAllNodes(isLive).assertCountEquals(0)
        step = plain("Reviews due: 4")
        composeRule.onAllNodes(isLive).assertCountEquals(0)
        step = plain("Reviews due: 3")

        composeRule.onNode(hasAnyDescendant(hasTestTag(INK_PILL)) and speaksPolitely).assertExists()
    }

    @Test
    fun `the go button stays silent when its step first arrives after loading`() {
        var step: MyGameLabel? by mutableStateOf(null)
        show { MyGameDock(go = startTheReviews(), step = step, onFoldChange = {}) }

        step = dueReviews

        composeRule.onAllNodes(isLive).assertCountEquals(0)
    }

    @Test
    fun `a busy go button with no step draws no skeleton`() {
        show { MyGameDock(go = startTheReviews().copy(isBusy = true), step = null, onFoldChange = {}) }
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)

        composeRule
            .onNodeWithTag(INK_PILL)
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "Waiting"))
        val skeletons: Int = composeRule
            .onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true)
            .fetchSemanticsNodes()
            .size
        assertEquals(0, skeletons)
    }

    @Test
    fun `the dock is a traversal group whose index the caller sets`() {
        show {
            MyGameDock(
                go = startTheReviews(),
                step = dueReviews,
                onFoldChange = {},
                modifier = Modifier.semantics { traversalIndex = -1f },
            )
        }

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.IsTraversalGroup, true))
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.TraversalIndex, -1f))
    }

    private fun placedGoButton(): SemanticsNode = composeRule
        .onAllNodesWithTag(INK_PILL, useUnmergedTree = true)
        .fetchSemanticsNodes()
        .single { node: SemanticsNode -> node.layoutInfo.isPlaced }

    private fun placedText(text: String): List<SemanticsNode> = composeRule
        .onAllNodesWithText(text, useUnmergedTree = true)
        .fetchSemanticsNodes()
        .filter { node: SemanticsNode -> node.layoutInfo.isPlaced }

    private fun step2Px(): Float = with(composeRule.density) { MyGameSpacing.step2.toPx() }
}
