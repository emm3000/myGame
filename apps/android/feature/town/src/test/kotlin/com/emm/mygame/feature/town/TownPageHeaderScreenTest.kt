package com.emm.mygame.feature.town

import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.model.town.SeasonKind
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.days

@RunWith(RobolectricTestRunner::class)
class TownPageHeaderScreenTest : TownScreenFixture() {

    @Test
    fun `heads Town with the town's name and label in title`() {
        show(riverton)

        composeRule.onNodeWithText("Riverton · Pueblo").assert(isHeading()).assertIsDisplayed()
    }

    @Test
    fun `draws the season line in Town's header`() {
        show(riverton.copy(season = summer))

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
}
