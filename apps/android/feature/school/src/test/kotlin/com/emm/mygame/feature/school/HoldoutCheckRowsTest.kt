package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class HoldoutCheckRowsTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val opened: MutableList<HoldoutCheckRow> = mutableListOf()

    private val secondBandEighthWeek: HoldoutCheckRow = HoldoutCheckRow(PlacementBand.Second, HoldoutCheckWeek.Eighth)

    private fun showing(state: HoldoutCheckRowsUiState) {
        composeRule.setContent {
            MyGameTheme {
                HoldoutCheckRows(state = state, onHoldoutCheckOpen = { opened += it })
            }
        }
    }

    @Test
    fun `draws the band of a due check`() {
        showing(HoldoutCheckRowsUiState(listOf(secondBandEighthWeek)))

        composeRule.onNodeWithText("Tienes pendiente una prueba de palabras de la banda 2.").assertIsDisplayed()
    }

    @Test
    fun `opens the check of its row`() {
        showing(HoldoutCheckRowsUiState(listOf(secondBandEighthWeek)))

        composeRule.onNodeWithText("Abrir la prueba").performClick()

        assertEquals(listOf(secondBandEighthWeek), opened)
    }

    @Test
    fun `draws one way in per due check`() {
        showing(
            HoldoutCheckRowsUiState(
                listOf(secondBandEighthWeek, HoldoutCheckRow(PlacementBand.First, HoldoutCheckWeek.TwentyFourth)),
            ),
        )

        composeRule.onAllNodesWithText("Abrir la prueba").assertCountEquals(2)
    }

    @Test
    fun `draws nothing without a due check`() {
        showing(HoldoutCheckRowsUiState(emptyList()))

        composeRule.onAllNodesWithText("Abrir la prueba").assertCountEquals(0)
    }
}
