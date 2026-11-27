package com.emm.mygame.feature.placement

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.placement.PlacementScore
import com.emm.mygame.core.testing.dogMeaning
import com.emm.mygame.core.testing.house
import com.emm.mygame.core.testing.houseMeaning
import com.emm.mygame.core.testing.walk
import com.emm.mygame.core.testing.walkMeaning
import com.emm.mygame.core.ui.assertAskingProgressDrawnOnce
import com.emm.mygame.core.ui.hasCopy
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "+w411dp-h891dp")
class PlacementScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<PlacementIntent> = mutableListOf()

    private var doneTaps: Int = 0

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
                PlacementScreen(state = state, onIntent = { intents += it }, onDone = { doneTaps += 1 })
            }
        }
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
    fun `draws the band and the shown word's place once in the body, above the track`() {
        showing(askingFirstBand)

        assertAskingProgressDrawnOnce(composeRule, band = "Banda 1", position = "Palabra 1 de 2")
    }

    @Test
    fun `draws the shown word's place in the band`() {
        showing(askingFirstBand)

        composeRule.onNode(hasText("Palabra 1 de 2")).assertIsDisplayed()
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

        composeRule.onNode(wayOn(SEND_BAND)).performScrollTo().performClick()

        assertEquals(listOf(PlacementIntent.BandSent), intents)
    }

    @Test
    fun `the placement's verdict is drawn in the task's flow, beside the control it answers`() {
        val everyWordChosen: Map<WordId, ChoiceId> = mapOf(house.word to houseMeaning, walk.word to walkMeaning)
        showing(askingFirstBand.copy(shownIndex = 1, chosen = everyWordChosen, request = PlacementRequest.Unreachable))
        val inScroll: SemanticsMatcher = hasAnyAncestor(hasScrollAction())
        val verdict: SemanticsMatcher = hasText(UNREACHABLE)
        val send: SemanticsMatcher = wayOn(SEND_BAND)

        composeRule.onNode(verdict).assert(inScroll)
        composeRule.onNode(send).assert(inScroll)
        val verdictBottom: Dp = composeRule.onNode(verdict).getUnclippedBoundsInRoot().bottom
        val sendTop: Dp = composeRule.onNode(send).getUnclippedBoundsInRoot().top
        assertTrue(verdictBottom <= sendTop)
        assertTrue(sendTop - verdictBottom <= MyGameSpacing.step4)
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
    fun `the placement's start is its way on`() {
        showing(PlacementUiState.Offered(PlacementRequest.Idle))

        composeRule.onNode(wayOn(START)).performScrollTo().performClick()

        assertEquals(listOf(PlacementIntent.StartTapped), intents)
    }

    @Test
    fun `the placement's skip stays outlined in the content`() {
        showing(PlacementUiState.Offered(PlacementRequest.Idle))

        composeRule.onNode(hasTestTag(OUTLINED_PILL).and(hasText(SKIP)))
            .assertExists()
    }

    @Test
    fun `an unchosen meaning keeps the way on blocked with its reason`() {
        showing(askingFirstBand)

        composeRule.onNode(wayOn(NEXT).and(hasStateDescription(CHOOSE))).assertExists()
    }

    @Test
    fun `a chosen meaning makes the way on the next word`() {
        showing(askingFirstBand.copy(chosen = mapOf(house.word to houseMeaning)))

        composeRule.onNode(wayOn(NEXT)).performScrollTo().performClick()

        assertEquals(listOf(PlacementIntent.NextTapped), intents)
    }

    @Test
    fun `after the placement its way on returns to what opened it`() {
        showing(PlacementUiState.Closed(placedAtSecondBand.scores))

        composeRule.onNode(wayOn(DONE)).performScrollTo().performClick()

        assertEquals(1, doneTaps)
    }

    @Test
    fun `each placement state draws at most one go button`() {
        val states: List<PlacementUiState> = listOf(
            PlacementUiState.Loading,
            PlacementUiState.Failed,
            PlacementUiState.Offered(PlacementRequest.Idle),
            askingFirstBand,
            askingFirstBand.copy(shownIndex = 1),
            PlacementUiState.Closed(placedAtSecondBand.scores),
        )
        val shown: MutableState<PlacementUiState> = mutableStateOf(states.first())
        composeRule.setContent {
            MyGameTheme {
                PlacementScreen(state = shown.value, onIntent = {}, onDone = {})
            }
        }

        states.forEach { state: PlacementUiState ->
            shown.value = state
            composeRule.waitForIdle()

            assertTrue(composeRule.onAllNodesWithTag(INK_PILL).fetchSemanticsNodes().size <= 1)
        }
    }

    private fun wayOn(label: String): SemanticsMatcher = hasTestTag(INK_PILL).and(hasCopy(label))

    private companion object {
        const val START: String = "Empezar la prueba"
        const val SKIP: String = "Saltar la prueba"
        const val SEND_BAND: String = "Enviar la banda 1"
        const val NEXT: String = "Siguiente"
        const val DONE: String = "Continuar"
        const val CHOOSE: String = "Elige un significado para seguir."
        const val UNREACHABLE: String =
            "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val NOTHING_TO_TAKE: String =
            "No tienes ninguna prueba de nivel pendiente. Tus lecciones te esperan en la pestaña Aprender."
    }
}
