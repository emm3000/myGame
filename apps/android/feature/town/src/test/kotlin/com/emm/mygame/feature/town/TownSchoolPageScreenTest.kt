package com.emm.mygame.feature.town

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.uitesting.outlinedDoorOf
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownSchoolPageScreenTest : TownScreenFixture() {

    @Test
    fun `opens your lessons from the school page's outlined door`() {
        show(riverton, place = TownBuildingKind.School)

        composeRule.onNode(outlinedDoorOf("Ir a tus lecciones"), useUnmergedTree = true)
            .performScrollTo()
            .performClick()

        assertEquals(1, schoolOpens)
    }

    @Test
    fun `draws the town's words on the school's page`() {
        show(riverton, place = TownBuildingKind.School)

        composeRule.onNodeWithText("Palabras fuera de aprendizaje: 3").performScrollTo().assertIsDisplayed()
    }
}
