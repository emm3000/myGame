package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

private fun plain(text: String): MyGameLabel = MyGameLabel(text = text, translation = null)

private val storageAtTopLevel: MyGameArt =
    MyGameArt(drawable = R.drawable.designsystem_place_storage_10, tint = MyGameArtTint.None)

private val farmAtLevelTwo: MyGameArt =
    MyGameArt(drawable = R.drawable.designsystem_place_farm_2, tint = MyGameArtTint.None)

private val wordsForLevelThree: MyGamePlaceWords =
    MyGamePlaceWords(line = plain("Words for level 3: 2 of 5"), needed = 5, held = 2)

private val tallWork: Dp = 400.dp

private val pageThatFitsWithASmallerArt: Dp = 240.dp

private const val DP_TOLERANCE: Float = 0.5f

private const val TRACK_SETTLE_TIMEOUT_MILLIS: Long = 2_000L

private val hasArt: SemanticsMatcher = SemanticsMatcher.keyIsDefined(PLACE_ART)

private val scrolls: SemanticsMatcher = SemanticsMatcher.keyIsDefined(SemanticsProperties.VerticalScrollAxisRange)

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(qualifiers = "+w360dp-h640dp")
class MyGamePlacePageTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private fun show(content: @Composable () -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                content()
            }
        }
    }

    private fun artHeight(): Dp = with(composeRule.density) {
        composeRule.onNode(hasArt, useUnmergedTree = true).fetchSemanticsNode().size.height.toDp()
    }

    private fun scrollRange(): Float = composeRule.onNode(scrolls).fetchSemanticsNode()
        .config[SemanticsProperties.VerticalScrollAxisRange].maxValue()

    @Test
    fun `a page given no words line draws none`() {
        show {
            MyGamePlacePage(
                art = storageAtTopLevel,
                name = plain("Storage"),
                level = plain("Top level"),
                modifier = Modifier.fillMaxSize(),
            )
        }

        composeRule.onAllNodesWithTag(TRACK_FILL, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    @Config(fontScale = 2.0f)
    fun `the art shrinks to the thumbnail before the page scrolls at font scale 2`() {
        show {
            MyGamePlacePage(
                art = farmAtLevelTwo,
                name = plain("Farm"),
                level = plain("Level 2"),
                modifier = Modifier.fillMaxSize(),
                words = wordsForLevelThree,
                work = { Spacer(modifier = Modifier.height(tallWork)) },
            )
        }

        assertEquals(MyGameSizes.thumbnail.value, artHeight().value, DP_TOLERANCE)
        assertTrue("the page scrolls", scrollRange() > 0f)
    }

    @Test
    @Config(fontScale = 2.0f)
    fun `the page keeps still while a smaller art makes it fit at font scale 2`() {
        show {
            Box(modifier = Modifier.fillMaxSize()) {
                MyGamePlacePage(
                    art = farmAtLevelTwo,
                    name = plain("Farm"),
                    level = plain("Level 2"),
                    modifier = Modifier.fillMaxWidth().height(pageThatFitsWithASmallerArt),
                )
            }
        }

        val art: Dp = artHeight()
        assertTrue("$art is under the full art", art < MyGameSizes.placeCard)
        assertTrue("$art is over the thumbnail", art > MyGameSizes.thumbnail)
        assertEquals(0f, scrollRange(), DP_TOLERANCE)
    }

    @Test
    fun `the art stands at full size while the page fits at font scale 1`() {
        show {
            MyGamePlacePage(
                art = farmAtLevelTwo,
                name = plain("Farm"),
                level = plain("Level 2"),
                modifier = Modifier.fillMaxSize(),
                words = wordsForLevelThree,
            )
        }

        assertEquals(MyGameSizes.placeCard.value, artHeight().value, DP_TOLERANCE)
    }

    @Test
    fun `the page draws its parts from the header down to the work`() {
        show {
            MyGamePlacePage(
                art = farmAtLevelTwo,
                name = plain("Farm"),
                level = plain("Level 2"),
                modifier = Modifier.fillMaxSize(),
                words = wordsForLevelThree,
                header = { MyGameText(text = "Maple Hollow", style = MyGameTypography.title, color = Color.Black) },
                work = { MyGameText(text = "The slot is free.", style = MyGameTypography.body, color = Color.Black) },
            )
        }

        val tops: List<Float> = listOf(
            topOf(hasText("Maple Hollow")),
            topOf(hasArt),
            topOf(hasText("Farm")),
            topOf(hasText("Level 2")),
            topOf(hasText("Words for level 3: 2 of 5")),
            topOf(hasText("The slot is free.")),
        )
        assertEquals(tops.sorted(), tops)
    }

    @Test
    fun `the words track fills one segment for each word held`() {
        show {
            MyGamePlacePage(
                art = farmAtLevelTwo,
                name = plain("Farm"),
                level = plain("Level 2"),
                modifier = Modifier.fillMaxSize(),
                words = wordsForLevelThree,
            )
        }

        composeRule.waitUntil(timeoutMillis = TRACK_SETTLE_TIMEOUT_MILLIS) {
            filledSegments() == wordsForLevelThree.held
        }
        assertEquals(wordsForLevelThree.needed, segments().size)
    }

    @Test
    fun `the header slot stacks its items`() {
        show {
            MyGamePlacePage(
                art = farmAtLevelTwo,
                name = plain("Farm"),
                level = plain("Level 2"),
                modifier = Modifier.fillMaxSize(),
                header = {
                    MyGameText(text = "Maple Hollow", style = MyGameTypography.title, color = Color.Black)
                    MyGameText(text = "Place 2 of 7", style = MyGameTypography.meta, color = Color.Black)
                },
            )
        }

        val townBottom: Float = boundsOf(hasText("Maple Hollow")).bottom
        assertTrue("the second item starts under the first", boundsOf(hasText("Place 2 of 7")).top >= townBottom)
    }

    private fun segments(): List<SemanticsNode> =
        composeRule.onAllNodesWithTag(TRACK_FILL, useUnmergedTree = true).fetchSemanticsNodes()

    private fun filledSegments(): Int = segments().count { fill: SemanticsNode -> fill.size.width > 0 }

    private fun topOf(matcher: SemanticsMatcher): Float = boundsOf(matcher).top

    private fun boundsOf(matcher: SemanticsMatcher): Rect =
        composeRule.onNode(matcher, useUnmergedTree = true).fetchSemanticsNode().boundsInRoot
}
