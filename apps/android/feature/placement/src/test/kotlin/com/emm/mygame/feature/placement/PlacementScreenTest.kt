package com.emm.mygame.feature.placement

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementScore
import com.emm.mygame.core.network.WordId
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class PlacementScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<PlacementIntent> = mutableListOf()

    private var townOpens: Int = 0

    private val askingFirstBand: PlacementUiState.Asking = PlacementUiState.Asking(
        band = PlacementBand.First,
        items = listOf(house, walk),
        scores = emptyList(),
        shownIndex = 0,
        chosen = emptyMap(),
        request = PlacementRequest.Idle,
    )

    private fun showing(state: PlacementUiState) {
        composeRule.setContent {
            MyGameTheme {
                PlacementScreen(state = state, onIntent = { intents += it }, onTownOpen = { townOpens += 1 })
            }
        }
    }

    @Test
    fun `starts the placement from the offer`() {
        showing(PlacementUiState.Offered(PlacementRequest.Idle))

        composeRule.onNodeWithText("Empezar la prueba").performScrollTo().performClick()

        assertEquals(listOf(PlacementIntent.StartTapped), intents)
    }

    @Test
    fun `skips the placement from the offer`() {
        showing(PlacementUiState.Offered(PlacementRequest.Idle))

        composeRule.onNodeWithText("Saltar la prueba").performScrollTo().performClick()

        assertEquals(listOf(PlacementIntent.SkipTapped), intents)
    }

    @Test
    fun `draws the outage beside the offer`() {
        showing(PlacementUiState.Offered(PlacementRequest.Unreachable))

        composeRule.onNodeWithText(UNREACHABLE).assertIsDisplayed()
    }

    @Test
    fun `draws the shown word alone`() {
        showing(askingFirstBand)

        composeRule.onAllNodesWithText("walk").assertCountEquals(0)
    }

    @Test
    fun `draws the shown word's place in the band`() {
        showing(askingFirstBand)

        composeRule.onNodeWithText("Palabra 1 de 2").assertIsDisplayed()
    }

    @Test
    fun `chooses a meaning of the shown word`() {
        showing(askingFirstBand)

        composeRule.onNodeWithText("perro").performClick()

        assertEquals(listOf<PlacementIntent>(PlacementIntent.ChoiceChosen(dogMeaning)), intents)
    }

    @Test
    fun `sends the band from its last word`() {
        val everyWordChosen: Map<WordId, ChoiceId> = mapOf(house.word to houseMeaning, walk.word to walkMeaning)
        showing(askingFirstBand.copy(shownIndex = 1, chosen = everyWordChosen))

        composeRule.onNodeWithText("Enviar la banda 1").performScrollTo().performClick()

        assertEquals(listOf(PlacementIntent.BandSent), intents)
    }

    @Test
    fun `draws a band placed out as the api marked it whatever its score`() {
        showing(PlacementUiState.Closed(listOf(PlacementScore(PlacementBand.First, score = 12, isPlacedOut = true))))

        composeRule.onNodeWithText("Superada: sus lecciones cuentan como sabidas.").assertIsDisplayed()
    }

    @Test
    fun `draws a band not placed out as the api marked it whatever its score`() {
        showing(PlacementUiState.Closed(listOf(PlacementScore(PlacementBand.First, score = 30, isPlacedOut = false))))

        composeRule.onNodeWithText("No superada.").assertIsDisplayed()
    }

    @Test
    fun `draws each band's score`() {
        showing(PlacementUiState.Closed(placedAtSecondBand.scores))

        composeRule.onNodeWithText("Banda 2: 12 aciertos").assertIsDisplayed()
    }

    @Test
    fun `draws a closed placement with no score as nothing left to take`() {
        showing(PlacementUiState.Closed(emptyList()))

        composeRule.onNodeWithText(NOTHING_TO_TAKE).assertIsDisplayed()
    }

    @Test
    fun `returns to the town from the result`() {
        showing(PlacementUiState.Closed(emptyList()))

        composeRule.onNodeWithText("Volver a tu pueblo").performScrollTo().performClick()

        assertEquals(1, townOpens)
    }

    private companion object {
        const val UNREACHABLE: String =
            "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val NOTHING_TO_TAKE: String =
            "No tienes ninguna prueba de nivel pendiente. Tus lecciones te esperan en la escuela."
    }
}
