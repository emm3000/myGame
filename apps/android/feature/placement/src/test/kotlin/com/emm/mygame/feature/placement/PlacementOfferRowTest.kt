package com.emm.mygame.feature.placement

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
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

    private fun showing(state: PlacementOfferUiState) {
        composeRule.setContent {
            MyGameTheme {
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
    fun `opens the offered placement`() {
        showing(PlacementOfferUiState.Offered)

        composeRule.onNodeWithText("Hacer la prueba de nivel").performClick()

        assertEquals(1, placementOpens)
    }

    @Test
    fun `offers to go on with a band being asked`() {
        showing(PlacementOfferUiState.Asking)

        composeRule.onNodeWithText("Seguir con la prueba de nivel").performClick()

        assertEquals(1, placementOpens)
    }
}
