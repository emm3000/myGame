package com.emm.mygame.feature.placement

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementScore
import com.emm.mygame.core.network.WordId
import com.emm.mygame.core.ui.TaskDockHook
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
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

    private val hook: TaskDockHook = TaskDockHook(onAnswered = {})

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
            TaskFrameStandIn(hook = hook) {
                PlacementScreen(state = state, onIntent = { intents += it }, hook = hook)
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
    fun `draws the shown word's place in the band`() {
        showing(askingFirstBand)

        composeRule.onNode(hasText("Palabra 1 de 2").and(inTaskDock.not())).assertIsDisplayed()
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

        composeRule.onNode(dockGo("Enviar la banda 1")).performClick()

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
    fun `the placement's start is the dock's go button`() {
        showing(PlacementUiState.Offered(PlacementRequest.Idle))

        composeRule.onNode(dockGo(START)).performClick()

        assertEquals(listOf(PlacementIntent.StartTapped), intents)
    }

    @Test
    fun `the placement's skip stays outlined in the content`() {
        showing(PlacementUiState.Offered(PlacementRequest.Idle))

        composeRule.onNode(hasTestTag(OUTLINED_PILL).and(hasText(SKIP)).and(inTaskDock.not()))
            .assertExists()
    }

    @Test
    fun `an unchosen meaning keeps the go button blocked with its reason`() {
        showing(askingFirstBand)

        composeRule.onNode(dockGo("Siguiente").and(hasStateDescription(CHOOSE))).assertExists()
    }

    @Test
    fun `a chosen meaning makes the go button the next word`() {
        showing(askingFirstBand.copy(chosen = mapOf(house.word to houseMeaning)))

        composeRule.onNode(dockGo("Siguiente")).performClick()

        assertEquals(listOf(PlacementIntent.NextTapped), intents)
    }

    @Test
    fun `the dock's line is the shown word's place in the band`() {
        showing(askingFirstBand)

        composeRule.onNode(hasText("Palabra 1 de 2").and(inTaskDock)).assertExists()
    }

    @Test
    fun `after the placement the go button is the town's next step`() {
        showing(PlacementUiState.Closed(placedAtSecondBand.scores))

        composeRule.waitForIdle()
        assertNotNull(hook.town)
        assertNull(hook.dock)
        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(0)
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
            TaskFrameStandIn(hook = hook) {
                PlacementScreen(state = shown.value, onIntent = {}, hook = hook)
            }
        }

        states.forEach { state: PlacementUiState ->
            shown.value = state
            composeRule.waitForIdle()

            assertTrue(composeRule.onAllNodesWithTag(INK_PILL).fetchSemanticsNodes().size <= 1)
        }
    }

    private companion object {
        const val START: String = "Empezar la prueba"
        const val SKIP: String = "Saltar la prueba"
        const val CHOOSE: String = "Elige un significado para seguir."
        const val UNREACHABLE: String =
            "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
        const val NOTHING_TO_TAKE: String =
            "No tienes ninguna prueba de nivel pendiente. Tus lecciones te esperan en la escuela."
    }
}
