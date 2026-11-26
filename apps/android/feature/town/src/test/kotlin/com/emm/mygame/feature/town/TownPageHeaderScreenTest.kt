package com.emm.mygame.feature.town

import androidx.compose.foundation.text.BasicText
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.model.town.SeasonKind
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.days

@RunWith(RobolectricTestRunner::class)
class TownPageHeaderScreenTest : TownScreenFixture() {

    @Test
    fun `heads every page with the town's name and label in title`() {
        show(riverton)

        composeRule.onNodeWithText("Riverton · Pueblo").assert(isHeading()).assertIsDisplayed()
        tab("Hogares").performScrollTo().performClick()
        composeRule.onNodeWithText("Riverton · Pueblo").assertIsDisplayed()
    }

    @Test
    fun `tells the page's place on the street`() {
        show(riverton)

        composeRule.onNodeWithText("Edificio 3 de 7").assertIsDisplayed()
    }

    @Test
    fun `draws the ring on every page`() {
        show(riverton, ring = { BasicText(RING) })
        composeRule.onNodeWithText(RING).assertIsDisplayed()

        tab("Fábrica").performScrollTo().performClick()

        composeRule.onNodeWithText(RING).assertIsDisplayed()
    }

    @Test
    fun `draws the season line in the header of every page`() {
        show(riverton.copy(season = summer))
        composeRule.onNodeWithText("Verano, año 2").assertIsDisplayed()

        tab("Hogares").performScrollTo().performClick()

        composeRule.onNodeWithText("Verano, año 2").assertIsDisplayed()
    }

    @Test
    fun `offers no sign-out on the town home`() {
        show(riverton)

        composeRule.onAllNodesWithText("Salir").assertCountEquals(0)
    }

    private val summer: SeasonLine = SeasonLine(
        kind = SeasonKind.Summer,
        year = 2,
        remaining = 3.days,
        productionMarks = emptyList(),
    )

    private companion object {
        const val RING: String = "Ring"
    }
}
