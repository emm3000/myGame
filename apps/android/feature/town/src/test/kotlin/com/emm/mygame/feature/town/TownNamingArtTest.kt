package com.emm.mygame.feature.town

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import com.emm.mygame.core.designsystem.MyGameArt
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.PLACE_ART
import com.emm.mygame.core.network.TownBuildingKind
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class TownNamingArtTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val drawnPlaces: SemanticsMatcher = SemanticsMatcher.keyIsDefined(PLACE_ART)

    private var silhouette: Color = Color.Unspecified

    private var ground: Color = Color.Unspecified

    @Test
    fun `draws the homes and the school on the naming screen`() {
        showNaming()

        assertEquals(
            listOf(placeArtOf(TownBuildingKind.Homes, level = 0), placeArtOf(TownBuildingKind.School, level = 0)),
            composeRule.onAllNodes(drawnPlaces).fetchSemanticsNodes().map(::artOf),
        )
    }

    @Test
    fun `draws the naming screen's places as surface-sunken silhouettes`() {
        showNaming()

        val inks: List<Int> = composeRule.onAllNodes(drawnPlaces).fetchSemanticsNodes().indices.map { index: Int ->
            mostDrawnInkOf(composeRule.onAllNodes(drawnPlaces)[index].captureToImage(), ground.toArgb())
        }

        assertEquals(listOf(silhouette.toArgb(), silhouette.toArgb()), inks)
    }

    private fun showNaming() {
        composeRule.setContent {
            MyGameTheme {
                silhouette = MyGameTheme.colors.surfaceSunken
                ground = MyGameTheme.colors.surfaceRaised
                TownScreen(
                    state = TownUiState.Naming("", TownUiState.NamingStatus.Idle),
                    onIntent = {},
                    onSchoolOpen = {},
                    onReportOpen = {},
                    onReviewsOpen = {},
                    onLessonOpen = {},
                )
            }
        }
    }

    private fun artOf(node: SemanticsNode): MyGameArt = node.config[PLACE_ART]

    private fun mostDrawnInkOf(image: ImageBitmap, ground: Int): Int {
        val pixels: IntArray = IntArray(image.width * image.height)
        image.readPixels(pixels)
        return pixels.filter { pixel: Int -> pixel != ground }
            .groupingBy { pixel: Int -> pixel }
            .eachCount()
            .maxBy { entry: Map.Entry<Int, Int> -> entry.value }
            .key
    }
}
