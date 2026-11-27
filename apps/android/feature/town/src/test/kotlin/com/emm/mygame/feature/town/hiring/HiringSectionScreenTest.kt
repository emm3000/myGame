package com.emm.mygame.feature.town.hiring

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.uitesting.outlinedDoorOf
import com.emm.mygame.feature.town.TownScreenFixture
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class HiringSectionScreenTest : TownScreenFixture() {

    @Test
    fun `draws the office on the office's page`() {
        show(riverton, place = TownBuildingKind.Office)

        composeRule.onNodeWithText(OFFICE_IDLE).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws no office on another place's page`() {
        show(riverton, place = TownBuildingKind.Farm)

        composeRule.onAllNodesWithText(OFFICE_IDLE).assertCountEquals(0)
    }

    @Test
    fun `names the office once on the office's page`() {
        show(riverton, place = TownBuildingKind.Office)

        composeRule.onAllNodesWithText(OFFICE, useUnmergedTree = true).assertCountEquals(1)
    }

    @Test
    fun `opens the map from the office page's outlined door`() {
        show(riverton, place = TownBuildingKind.Office)

        composeRule.onNode(outlinedDoorOf("Ir al mapa"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(1, mapOpens)
    }

    private companion object {
        const val OFFICE: String = "Oficina"
        const val OFFICE_IDLE: String = "Ahora no hay ninguna contratación."
    }
}
