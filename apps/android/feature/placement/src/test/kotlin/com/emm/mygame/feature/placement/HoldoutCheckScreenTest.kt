package com.emm.mygame.feature.placement

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class HoldoutCheckScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<HoldoutCheckIntent> = mutableListOf()

    private var townOpens: Int = 0

    private val dueEighthWeek: HoldoutCheckUiState.Due =
        HoldoutCheckUiState.Due(PlacementBand.First, HoldoutCheckWeek.Eighth, HoldoutCheckRequest.Idle)

    private val askingFirstWord: HoldoutCheckUiState.Asking = HoldoutCheckUiState.Asking(
        band = PlacementBand.First,
        week = HoldoutCheckWeek.Eighth,
        items = listOf(house, walk),
        shownIndex = 0,
        chosen = emptyMap(),
        request = HoldoutCheckRequest.Idle,
    )

    private val askingLastWordChosen: HoldoutCheckUiState.Asking = askingFirstWord.copy(
        shownIndex = 1,
        chosen = mapOf(house.word to houseMeaning, walk.word to walkMeaning),
    )

    private fun showing(state: HoldoutCheckUiState) {
        composeRule.setContent {
            MyGameTheme {
                HoldoutCheckScreen(state = state, onIntent = { intents += it }, onTownOpen = { townOpens += 1 })
            }
        }
    }

    @Test
    fun `draws the check in English under the none scaffold`() {
        composeRule.setContent {
            ProvideCopyLanguage(CopyLanguage(ScaffoldLanguage.None, ChromePhase.Scaffold)) {
                MyGameTheme {
                    HoldoutCheckScreen(state = dueEighthWeek, onIntent = {}, onTownOpen = {})
                }
            }
        }

        composeRule.onNodeWithText("Start the check").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the due line with the band and the week the api named`() {
        showing(dueEighthWeek.copy(band = PlacementBand.Second, week = HoldoutCheckWeek.TwentyFourth))

        composeRule.onNodeWithText("Banda 2, semana 24", substring = true).assertIsDisplayed()
    }

    @Test
    fun `starts the check from the due line`() {
        showing(dueEighthWeek)

        composeRule.onNodeWithText("Empezar la prueba").performScrollTo().performClick()

        assertEquals(listOf(HoldoutCheckIntent.StartTapped), intents)
    }

    @Test
    fun `skips the check from the due line`() {
        showing(dueEighthWeek)

        composeRule.onNodeWithText("Saltar la prueba").performScrollTo().performClick()

        assertEquals(listOf(HoldoutCheckIntent.SkipTapped), intents)
    }

    @Test
    fun `draws the refusal inline on a 409`() {
        showing(dueEighthWeek.copy(request = HoldoutCheckRequest.Refused))

        composeRule.onNodeWithText("Esta prueba no está abierta ahora.").assertIsDisplayed()
    }

    @Test
    fun `draws the refusal beside the words of a refused send`() {
        showing(askingLastWordChosen.copy(request = HoldoutCheckRequest.Refused))

        composeRule.onNodeWithText("Esta prueba no está abierta ahora.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the outage beside the due line`() {
        showing(dueEighthWeek.copy(request = HoldoutCheckRequest.Unreachable))

        composeRule.onNodeWithText("No hemos podido hablar con el servidor", substring = true).assertIsDisplayed()
    }

    @Test
    fun `draws the shown word with its choices`() {
        showing(askingFirstWord)

        composeRule.onNodeWithText("house").assertIsDisplayed()
        composeRule.onNodeWithText("perro").assertIsDisplayed()
    }

    @Test
    fun `chooses a meaning for the shown word`() {
        showing(askingFirstWord)

        composeRule.onNodeWithText("casa").performScrollTo().performClick()

        assertEquals(listOf(HoldoutCheckIntent.ChoiceChosen(houseMeaning)), intents)
    }

    @Test
    fun `sends every answer from the last word`() {
        showing(askingLastWordChosen)

        composeRule.onNodeWithText("Enviar tus respuestas").performScrollTo().performClick()

        assertEquals(listOf(HoldoutCheckIntent.AnswersSent), intents)
    }

    @Test
    fun `draws the done line after a skip`() {
        showing(HoldoutCheckUiState.Done)

        composeRule.onNodeWithText("Gracias. Tus respuestas están guardadas.").assertIsDisplayed()
    }

    @Test
    fun `goes back to the town from the done line`() {
        showing(HoldoutCheckUiState.Done)

        composeRule.onNodeWithText("Volver a tu pueblo").performScrollTo().performClick()

        assertEquals(1, townOpens)
    }

    @Test
    fun `draws the failed read with its retry`() {
        showing(HoldoutCheckUiState.Failed)

        composeRule.onNodeWithText("No hemos podido leer tu prueba.").assertIsDisplayed()
        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf(HoldoutCheckIntent.RetryTapped), intents)
    }
}
