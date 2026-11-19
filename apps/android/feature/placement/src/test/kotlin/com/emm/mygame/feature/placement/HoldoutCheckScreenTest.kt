package com.emm.mygame.feature.placement

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.HoldoutCheckRefusal
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
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
class HoldoutCheckScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<HoldoutCheckIntent> = mutableListOf()

    private val hook: TaskDockHook = TaskDockHook(onAnswered = {})

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
            TaskFrameStandIn(hook = hook) {
                HoldoutCheckScreen(state = state, onIntent = { intents += it }, hook = hook, foldedDock = {})
            }
        }
    }

    @Test
    fun `draws the check in English under the none scaffold`() {
        composeRule.setContent {
            ProvideCopyLanguage(CopyLanguage(ScaffoldLanguage.None, ChromePhase.Scaffold)) {
                TaskFrameStandIn(hook = hook) {
                    HoldoutCheckScreen(state = dueEighthWeek, onIntent = {}, hook = hook, foldedDock = {})
                }
            }
        }

        composeRule.onNode(dockGo("Start the check")).assertIsDisplayed()
    }

    @Test
    fun `draws the band and the shown word's place once in the body, above the track`() {
        showing(askingFirstWord)

        assertAskingProgressDrawnOnce(composeRule, band = "Banda 1", position = "Palabra 1 de 2")
    }

    @Test
    fun `draws the due line with the band and the week the api named`() {
        showing(dueEighthWeek.copy(band = PlacementBand.Second, week = HoldoutCheckWeek.TwentyFourth))

        composeRule.onNodeWithText("Banda 2, semana 24", substring = true).assertIsDisplayed()
    }

    @Test
    fun `the check's start is the dock's go button`() {
        showing(dueEighthWeek)

        composeRule.onNode(dockGo("Empezar la prueba")).performClick()

        assertEquals(listOf(HoldoutCheckIntent.StartTapped), intents)
    }

    @Test
    fun `the check's skip stays outlined in the content`() {
        showing(dueEighthWeek)

        composeRule.onNode(
            hasTestTag(OUTLINED_PILL).and(hasText("Saltar la prueba")).and(inTaskDock.not()),
        ).assertExists()
    }

    @Test
    fun `an unchosen meaning keeps the check's go button blocked with its reason`() {
        showing(askingLastWordChosen.copy(chosen = emptyMap()))

        composeRule.onNode(dockGo("Enviar tus respuestas").and(hasStateDescription(CHOOSE))).assertExists()
    }

    @Test
    fun `after the check the go button is the town's next step`() {
        showing(HoldoutCheckUiState.Answered)

        composeRule.waitForIdle()
        assertNotNull(hook.town)
        assertNull(hook.dock)
        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(0)
    }

    @Test
    fun `each check state draws at most one go button`() {
        val states: List<HoldoutCheckUiState> = listOf(
            HoldoutCheckUiState.Loading,
            HoldoutCheckUiState.Failed,
            dueEighthWeek,
            askingLastWordChosen,
            askingLastWordChosen.copy(shownIndex = 0, chosen = emptyMap()),
            HoldoutCheckUiState.Answered,
            HoldoutCheckUiState.Skipped,
            HoldoutCheckUiState.NotOpen,
        )
        val shown: MutableState<HoldoutCheckUiState> = mutableStateOf(states.first())
        composeRule.setContent {
            TaskFrameStandIn(hook = hook) {
                HoldoutCheckScreen(state = shown.value, onIntent = {}, hook = hook, foldedDock = {})
            }
        }

        states.forEach { state: HoldoutCheckUiState ->
            shown.value = state
            composeRule.waitForIdle()

            assertTrue(composeRule.onAllNodesWithTag(INK_PILL).fetchSemanticsNodes().size <= 1)
        }
    }

    @Test
    fun `skips the check from the due line`() {
        showing(dueEighthWeek)

        composeRule.onNodeWithText("Saltar la prueba").performScrollTo().performClick()

        assertEquals(listOf(HoldoutCheckIntent.SkipTapped), intents)
    }

    @Test
    fun `draws the check not open inline beside the due line`() {
        showing(
            dueEighthWeek.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Begin, HoldoutCheckRefusal.NotOpen),
            ),
        )

        composeRule.onNodeWithText("Esta prueba no está abierta ahora.").assertIsDisplayed()
    }

    @Test
    fun `draws the refusal of a refused send right above the dock's go button`() {
        showing(
            askingLastWordChosen.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Answers, HoldoutCheckRefusal.NotOpen),
            ),
        )

        composeRule.onNode(hasText("Esta prueba no está abierta ahora.").and(inTaskDock)).assertIsDisplayed()
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

        composeRule.onNode(dockGo("Enviar tus respuestas")).performClick()

        assertEquals(listOf(HoldoutCheckIntent.AnswersSent), intents)
    }

    @Test
    fun `draws the done line after the answers are sent`() {
        showing(HoldoutCheckUiState.Answered)

        composeRule.onNodeWithText("Gracias. Tus respuestas están guardadas.").assertIsDisplayed()
    }

    @Test
    fun `draws the skipped line after a skip`() {
        showing(HoldoutCheckUiState.Skipped)

        composeRule.onNodeWithText("Saltaste esta prueba.").assertIsDisplayed()
    }

    @Test
    fun `draws the unsaved answers line of an invalid send in the dock`() {
        showing(
            askingLastWordChosen.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Answers, HoldoutCheckRefusal.InvalidRequest),
            ),
        )

        composeRule.onNode(hasText("No hemos podido guardar tus respuestas.").and(inTaskDock)).assertIsDisplayed()
    }

    @Test
    fun `draws the check not open when the api cannot take a start`() {
        showing(
            dueEighthWeek.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Begin, HoldoutCheckRefusal.InvalidRequest),
            ),
        )

        composeRule.onNodeWithText("Esta prueba no está abierta ahora.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the check not open when the api cannot take a skip`() {
        showing(
            dueEighthWeek.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Skip, HoldoutCheckRefusal.InvalidRequest),
            ),
        )

        composeRule.onNodeWithText("Esta prueba no está abierta ahora.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the failed read`() {
        showing(HoldoutCheckUiState.Failed)

        composeRule.onNodeWithText("No hemos podido leer tu prueba.").assertIsDisplayed()
    }

    @Test
    fun `reads again from the failed read`() {
        showing(HoldoutCheckUiState.Failed)

        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf(HoldoutCheckIntent.RetryTapped), intents)
    }

    @Test
    fun `draws the check not open with the town's next step`() {
        showing(HoldoutCheckUiState.NotOpen)

        composeRule.onNodeWithText("Esta prueba no está abierta ahora.").assertIsDisplayed()
        assertNotNull(hook.town)
    }

    @Test
    fun `holds the choices while the answers are sent`() {
        showing(askingLastWordChosen.copy(request = HoldoutCheckRequest.Waiting(HoldoutCheckAction.Answers)))

        composeRule.onNodeWithText("correr").performScrollTo().assertIsNotEnabled()
    }

    @Test
    fun `draws the start busy while the begin waits`() {
        showing(dueEighthWeek.copy(request = HoldoutCheckRequest.Waiting(HoldoutCheckAction.Begin)))

        composeRule.onNode(hasTestTag(INK_PILL).and(inTaskDock)).assertIsNotEnabled()
    }

    private companion object {
        const val CHOOSE: String = "Elige un significado para seguir."
    }
}
