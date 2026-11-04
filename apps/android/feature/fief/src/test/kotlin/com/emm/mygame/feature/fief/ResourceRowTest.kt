package com.emm.mygame.feature.fief

import androidx.compose.ui.test.assertContentDescriptionEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.SeasonKind
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ResourceRowTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `reads the raised season mark after the row's description`() {
        draw(line(ResourceKind.Gold, FiefUiState.SeasonMark(SeasonKind.Autumn, change = 25)))

        composeRule.onNodeWithContentDescription("Oro", substring = true)
            .assertContentDescriptionEquals("Oro: 500 de 900, más 60 por hora. Otoño: +25 % de oro")
    }

    @Test
    fun `reads the lowered season mark after the row's description`() {
        draw(line(ResourceKind.Food, FiefUiState.SeasonMark(SeasonKind.Winter, change = -25)))

        composeRule.onNodeWithContentDescription("Comida", substring = true)
            .assertContentDescriptionEquals("Comida: 500 de 900, más 60 por hora. Invierno: -25 % de comida")
    }

    @Test
    fun `reads only the row's description with no season mark`() {
        draw(line(ResourceKind.Wood, seasonMark = null))

        composeRule.onNodeWithContentDescription("Madera", substring = true)
            .assertContentDescriptionEquals("Madera: 500 de 900, más 60 por hora")
    }

    private fun draw(resource: FiefUiState.ResourceLine) {
        composeRule.setContent {
            MyGameTheme {
                ResourceRow(resource = resource)
            }
        }
    }

    private fun line(kind: ResourceKind, seasonMark: FiefUiState.SeasonMark?): FiefUiState.ResourceLine =
        FiefUiState.ResourceLine(kind, amount = 500, capacity = 900, ratePerHour = 60, seasonMark = seasonMark)
}
