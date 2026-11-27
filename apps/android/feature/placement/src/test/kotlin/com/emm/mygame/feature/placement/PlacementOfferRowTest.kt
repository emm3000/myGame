package com.emm.mygame.feature.placement

import androidx.compose.ui.graphics.PixelMap
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.toPixelMap
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.dp
import com.emm.mygame.core.designsystem.HAIRLINE
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.uitesting.outlinedDoorOf
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlacementOfferRowTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var placementOpens: Int = 0

    private var colors: MyGameColors? = null

    private fun showing(state: PlacementOfferUiState) {
        composeRule.setContent {
            MyGameTheme(darkTheme = false) {
                colors = MyGameTheme.colors
                PlacementOfferRow(state = state, onPlacementOpen = { placementOpens += 1 })
            }
        }
    }

    @Test
    fun `draws nothing while no placement is offered`() {
        showing(PlacementOfferUiState.Hidden)

        composeRule.onAllNodesWithText("Prueba de nivel").assertCountEquals(0)
    }

    @Test
    fun `opens the offered placement from its outlined door`() {
        showing(PlacementOfferUiState.Offered)

        composeRule.onNode(outlinedDoorOf("Hacer la prueba de nivel"), useUnmergedTree = true).performClick()

        assertEquals(1, placementOpens)
    }

    @Test
    fun `offers to go on with a band being asked from its outlined door`() {
        showing(PlacementOfferUiState.Asking)

        composeRule.onNode(outlinedDoorOf("Seguir con la prueba de nivel"), useUnmergedTree = true).performClick()

        assertEquals(1, placementOpens)
    }

    @Test
    fun `draws no hairline inside its sunken fill`() {
        showing(PlacementOfferUiState.Offered)

        composeRule.onAllNodesWithTag(HAIRLINE, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `draws the offer on surface-sunken`() {
        showing(PlacementOfferUiState.Offered)

        val title: DpRect = composeRule.onNodeWithText("Prueba de nivel").getBoundsInRoot()
        val pixels: PixelMap = composeRule.onRoot().captureToImage().toPixelMap()
        val insideFillX: Int = with(composeRule.density) { (title.left - 8.dp).roundToPx() }
        val middle: Int = with(composeRule.density) { ((title.top + title.bottom) / 2).roundToPx() }
        assertEquals(colors?.surfaceSunken?.toArgb(), pixels[insideFillX, middle].toArgb())
    }
}
