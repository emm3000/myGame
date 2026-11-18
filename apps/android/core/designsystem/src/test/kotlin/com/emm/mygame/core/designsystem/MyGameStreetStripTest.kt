package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.toSize
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private const val SCHOOL_INDEX: Int = 2

private fun tab(word: String, level: Int, isNextStep: Boolean = false, isInWork: Boolean = false): MyGameStreetTab =
    MyGameStreetTab(
        art = MyGameArt(drawable = R.drawable.designsystem_place_homes_2, tint = MyGameArtTint.None),
        name = "$word, level $level",
        isNextStep = isNextStep,
        isInWork = isInWork,
    )

private val mainStreet: MyGameStreet = MyGameStreet(
    tabs = listOf(
        tab("Homes", 2),
        tab("Farm", 1, isInWork = true),
        tab("School", 3, isNextStep = true),
        tab("Office", 1),
        tab("Factory", 0),
        tab("Power station", 0),
        tab("Storage", 10),
    ),
)

private val phoneWidth: Dp = 360.dp

private const val PX_TOLERANCE: Float = 0.5f

private val isTab: SemanticsMatcher = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab)

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "+w360dp-h640dp")
class MyGameStreetStripTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun show(selected: Int = SCHOOL_INDEX, modifier: Modifier = Modifier, onSelect: (Int) -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                MyGameStreetStrip(
                    street = mainStreet,
                    selected = selected,
                    name = "5 of 7 built",
                    nextStepWords = "your next step",
                    inWorkWords = "in work",
                    onSelect = onSelect,
                    modifier = modifier,
                )
            }
        }
    }

    @Test
    fun `each place is a tab with its selected state`() {
        show()

        composeRule.onAllNodes(isTab).assertCountEquals(mainStreet.tabs.size)
        composeRule.onNodeWithContentDescription("School, level 3", substring = true).assertIsSelected()
        composeRule.onNodeWithContentDescription("Homes, level 2").assertIsNotSelected()
    }

    @Test
    fun `the next step's tab says so in its name`() {
        show()

        composeRule.onNode(isTab and hasContentDescription("School, level 3, your next step")).assertExists()
    }

    @Test
    fun `the place in work says so in its name`() {
        show()

        composeRule.onNode(isTab and hasContentDescription("Farm, level 1, in work")).assertExists()
    }

    @Test
    fun `the tabs follow the order the caller passes`() {
        show()

        val names: List<String?> = composeRule.onAllNodes(isTab).fetchSemanticsNodes()
            .sortedBy { node: SemanticsNode -> node.boundsInRoot.left }
            .map { node: SemanticsNode -> node.config.getOrNull(SemanticsProperties.ContentDescription)?.single() }
        assertEquals(
            listOf(
                "Homes, level 2",
                "Farm, level 1, in work",
                "School, level 3, your next step",
                "Office, level 1",
                "Factory, level 0",
                "Power station, level 0",
                "Storage, level 10",
            ),
            names,
        )
    }

    @Test
    fun `each tab is a target at least a control wide and tall`() {
        show()

        composeRule.onAllNodes(isTab).fetchSemanticsNodes().forEach { node: SemanticsNode ->
            val size: DpSize = with(composeRule.density) { node.size.toSize().toDpSize() }
            assertTrue("$size is wide enough", size.width >= MyGameSizes.control)
            assertTrue("$size is tall enough", size.height >= MyGameSizes.control)
        }
    }

    @Test
    fun `a tab hands its place to the caller`() {
        var picked: Int? = null
        show(onSelect = { index: Int -> picked = index })

        composeRule.onNodeWithContentDescription("Storage, level 10").performClick()

        assertEquals(mainStreet.tabs.lastIndex, picked)
    }

    @Test
    fun `the strip carries the caller's name line`() {
        show()

        composeRule.onNodeWithContentDescription("5 of 7 built").assertExists()
    }

    @Test
    fun `each tab stays a control wide inside the page gutter on a 360 dp phone`() {
        show(modifier = Modifier.padding(horizontal = MyGameSpacing.step5))

        composeRule.onAllNodes(isTab).fetchSemanticsNodes().forEach { node: SemanticsNode ->
            val width: Dp = with(composeRule.density) { node.size.width.toDp() }
            assertTrue("$width is wide enough", width >= MyGameSizes.control)
        }
    }

    @Test
    fun `the selected tab stays in view when the tabs run past the gutter`() {
        show(selected = mainStreet.tabs.lastIndex, modifier = Modifier.padding(horizontal = MyGameSpacing.step5))

        assertTrue("the tab ends at ${storageEnd()}, inside ${stripEnd()}", storageEnd() <= stripEnd() + PX_TOLERANCE)
    }

    @Test
    fun `a strip opened on a far place shows it on its first frame without sliding`() {
        composeRule.mainClock.autoAdvance = false
        show(selected = mainStreet.tabs.lastIndex, modifier = Modifier.padding(horizontal = MyGameSpacing.step5))

        assertTrue("the tab ends at ${storageEnd()}, inside ${stripEnd()}", storageEnd() <= stripEnd() + PX_TOLERANCE)
    }

    private fun storageEnd(): Float {
        val storage: SemanticsNode = composeRule.onNodeWithContentDescription("Storage, level 10").fetchSemanticsNode()
        return storage.positionInRoot.x + storage.size.width
    }

    private fun stripEnd(): Float = with(composeRule.density) { (phoneWidth - MyGameSpacing.step5).toPx() }
}
