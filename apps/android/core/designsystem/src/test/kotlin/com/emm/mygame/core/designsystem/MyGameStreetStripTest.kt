package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.input.InputMode
import androidx.compose.ui.input.InputModeManager
import androidx.compose.ui.platform.LocalInputModeManager
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.requestFocus
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.toSize
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
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

private const val PRESS_SETTLE_MILLIS: Long = 500L

private val isTab: SemanticsMatcher = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab)

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "+w360dp-h640dp")
class MyGameStreetStripTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var inputModes: InputModeManager? = null

    private fun show(
        selected: Int = SCHOOL_INDEX,
        street: MyGameStreet = mainStreet,
        modifier: Modifier = Modifier,
        onSelect: (Int) -> Unit = {},
    ) {
        composeRule.setContent {
            inputModes = LocalInputModeManager.current
            MyGameTheme {
                MyGameStreetStrip(
                    street = street,
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

    @Test
    fun `the strip draws one line-strong frame of radius md`() {
        show()

        val strip: PixelMap = stripPixels()
        val middle: Int = strip.height / 2
        val radius: Int = with(composeRule.density) { MyGameRadii.md.roundToPx() }
        val frame: String = hexOf(lightColors.lineStrong.toArgb())

        assertEquals("the start edge", frame, hexOf(strip[0, middle].toArgb()))
        assertEquals("the end edge", frame, hexOf(strip[strip.width - 1, middle].toArgb()))
        assertEquals("the top edge", frame, hexOf(strip[strip.width / 2, 0].toArgb()))
        assertEquals("the bottom edge", frame, hexOf(strip[strip.width / 2, strip.height - 1].toArgb()))
        assertEquals("the start edge runs straight from the radius", frame, hexOf(strip[0, radius].toArgb()))
        assertNotEquals("the corner still curves at half the radius", frame, hexOf(strip[0, radius / 2].toArgb()))
    }

    @Test
    fun `a line-strong hairline divides each tab from the one before`() {
        show()

        val strip: PixelMap = stripPixels()
        val middle: Int = strip.height / 2
        val frame: String = hexOf(lightColors.lineStrong.toArgb())
        val starts: List<Int> = composeRule.onAllNodes(isTab).fetchSemanticsNodes()
            .map { node: SemanticsNode -> node.positionInRoot.x.toInt() }
            .sorted()

        starts.drop(1).forEach { start: Int ->
            assertEquals("the divider at $start", frame, hexOf(strip[start, middle].toArgb()))
        }
        assertNotEquals("no divider inside a tab", frame, hexOf(strip[starts[1] + 1, middle].toArgb()))
    }

    @Test
    fun `each tab inside the frame keeps the tab role and a 48 by 48 target`() {
        show(modifier = Modifier.padding(horizontal = MyGameSpacing.step5))

        mainStreet.tabs.forEach { tab: MyGameStreetTab ->
            val node: SemanticsNode =
                composeRule.onNodeWithContentDescription(tab.name, substring = true).fetchSemanticsNode()
            val size: DpSize = with(composeRule.density) { node.size.toSize().toDpSize() }
            assertEquals("${tab.name} is a tab", Role.Tab, node.config.getOrNull(SemanticsProperties.Role))
            assertTrue("${tab.name} is $size", size.width >= 48.dp && size.height >= 48.dp)
        }
    }

    @Test
    fun `a selected first tab shows its whole ink bar`() {
        show(selected = 0, modifier = Modifier.padding(horizontal = MyGameSpacing.step5))

        assertInkBarDrawn(tabName = "Homes, level 2")
    }

    @Test
    fun `a selected last tab shows its whole ink bar`() {
        show(selected = mainStreet.tabs.lastIndex, modifier = Modifier.padding(horizontal = MyGameSpacing.step5))

        assertInkBarDrawn(tabName = "Storage, level 10")
    }

    @Test
    fun `a focused first tab's ring shows at the frame's edge`() {
        show(selected = SCHOOL_INDEX)
        focus("Homes, level 2")

        val strip: PixelMap = stripPixels()
        val homes: Rect = boundsInStrip("Homes, level 2")
        val ring: String = hexOf(lightColors.focus.toArgb())

        assertEquals("the ring's start edge", ring, hexOf(strip[homes.left.toInt(), homes.center.y.toInt()].toArgb()))
        assertEquals("the ring's top edge", ring, hexOf(strip[homes.center.x.toInt(), 0].toArgb()))
    }

    @Test
    fun `a focused tab's ring draws over its divider`() {
        show(selected = 0)
        focus("School, level 3, your next step")

        val strip: PixelMap = stripPixels()
        val school: Rect = boundsInStrip("School, level 3, your next step")

        assertEquals(
            hexOf(lightColors.focus.toArgb()),
            hexOf(strip[school.left.toInt(), school.center.y.toInt()].toArgb()),
        )
    }

    @Test
    fun `a focused pressed tab keeps its press inside its rounded shape`() {
        show(selected = 0, modifier = Modifier.background(lightColors.surface))
        focus("Office, level 1")
        composeRule.mainClock.autoAdvance = false
        composeRule.onNodeWithContentDescription("Office, level 1").performTouchInput { down(center) }
        composeRule.mainClock.advanceTimeBy(PRESS_SETTLE_MILLIS)

        val strip: PixelMap = stripPixels()
        val office: Rect = boundsInStrip("Office, level 1")
        val insideRing: Int = with(composeRule.density) { MyGameStrokeWidths.focus.roundToPx() } + 2
        val ground: String = hexOf(lightColors.surface.toArgb())

        assertEquals("the corner", ground, hexOf(strip[office.left.toInt() + 1, office.bottom.toInt() - 1].toArgb()))
        assertNotEquals(
            "the press inside the ring",
            ground,
            hexOf(strip[office.center.x.toInt(), office.bottom.toInt() - insideRing].toArgb()),
        )
    }

    @Test
    fun `no divider stands before the first tab`() {
        show()

        val strip: PixelMap = stripPixels()
        val homes: Rect = boundsInStrip("Homes, level 2")

        assertNotEquals(
            hexOf(lightColors.lineStrong.toArgb()),
            hexOf(strip[homes.left.toInt(), homes.center.y.toInt()].toArgb()),
        )
    }

    @Test
    fun `tabs that fit share the strip clear of its corners`() {
        show(selected = 0, street = MyGameStreet(tabs = mainStreet.tabs.take(3)))

        val strip: PixelMap = stripPixels()
        val lastTab: Rect = boundsInStrip("School, level 3, your next step")
        val corner: Float = with(composeRule.density) { MyGameSpacing.step2.toPx() }

        assertEquals(strip.width - corner, lastTab.right, PX_TOLERANCE * 2)
    }

    @Test
    fun `a selected middle tab sits at the strip's center`() {
        show(selected = SCHOOL_INDEX + 1, modifier = Modifier.padding(horizontal = MyGameSpacing.step5))

        val strip: PixelMap = stripPixels()
        val office: Rect = boundsInStrip("Office, level 1")

        assertEquals(strip.width / 2f, office.center.x, PX_TOLERANCE * 2)
    }

    private fun assertInkBarDrawn(tabName: String) {
        val strip: PixelMap = stripPixels()
        val tab: Rect = boundsInStrip(tabName)
        val bar: Rect = with(composeRule.density) {
            Rect(
                left = tab.center.x - MyGameSizes.control.toPx() / 2,
                top = tab.bottom - MyGameStrokeWidths.ring.toPx(),
                right = tab.center.x + MyGameSizes.control.toPx() / 2,
                bottom = tab.bottom,
            )
        }
        val ink: String = hexOf(lightColors.ink.toArgb())
        (bar.left.toInt() + 1 until bar.right.toInt() - 1).forEach { x: Int ->
            (bar.top.toInt() + 1 until bar.bottom.toInt()).forEach { y: Int ->
                assertEquals("the ink bar at $x, $y", ink, hexOf(strip[x, y].toArgb()))
            }
        }
    }

    @OptIn(ExperimentalComposeUiApi::class)
    private fun focus(tabName: String) {
        composeRule.runOnIdle { inputModes?.requestInputMode(InputMode.Keyboard) }
        composeRule.onNodeWithContentDescription(tabName).requestFocus()
        composeRule.waitForIdle()
    }

    private fun boundsInStrip(tabName: String): Rect {
        val strip: SemanticsNode = composeRule.onNodeWithContentDescription("5 of 7 built").fetchSemanticsNode()
        val tab: SemanticsNode = composeRule.onNodeWithContentDescription(tabName).fetchSemanticsNode()
        return Rect(
            left = tab.positionInRoot.x - strip.positionInRoot.x,
            top = tab.positionInRoot.y - strip.positionInRoot.y,
            right = tab.positionInRoot.x - strip.positionInRoot.x + tab.size.width,
            bottom = tab.positionInRoot.y - strip.positionInRoot.y + tab.size.height,
        )
    }

    private fun stripPixels(): PixelMap {
        val image: ImageBitmap = composeRule.onNodeWithContentDescription("5 of 7 built").captureToImage()
        return image.toPixelMap()
    }

    private fun hexOf(pixel: Int): String = Integer.toHexString(pixel)

    private fun storageEnd(): Float {
        val storage: SemanticsNode = composeRule.onNodeWithContentDescription("Storage, level 10").fetchSemanticsNode()
        return storage.positionInRoot.x + storage.size.width
    }

    private fun stripEnd(): Float = with(composeRule.density) { (phoneWidth - MyGameSpacing.step5).toPx() }
}
