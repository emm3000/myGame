package com.emm.mygame.feature.town

import androidx.compose.foundation.text.BasicText
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.ui.navRowOf
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownSchoolPageScreenTest : TownScreenFixture() {

    @Test
    fun `draws the placement offer on the school's page`() {
        show(riverton, placement = { BasicText(PLACEMENT) })
        composeRule.onNodeWithText(PLACEMENT).performScrollTo().assertIsDisplayed()

        tab("Granja").performScrollTo().performClick()

        composeRule.onAllNodesWithText(PLACEMENT).assertCountEquals(0)
    }

    @Test
    fun `opens the school from the school page's nav row`() {
        show(riverton)

        composeRule.onNode(navRowOf("Ir a la escuela"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(1, schoolOpens)
    }

    @Test
    fun `draws the town's words on the school's page`() {
        show(riverton)

        composeRule.onNodeWithText("Palabras fuera de aprendizaje: 3").performScrollTo().assertIsDisplayed()
    }

    private companion object {
        const val PLACEMENT: String = "Placement offer"
    }
}
