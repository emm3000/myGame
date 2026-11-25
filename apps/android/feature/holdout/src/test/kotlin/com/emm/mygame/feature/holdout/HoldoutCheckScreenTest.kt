package com.emm.mygame.feature.holdout

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.model.holdout.HoldoutCheckRefusal
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.testing.house
import com.emm.mygame.core.testing.houseMeaning
import com.emm.mygame.core.testing.walk
import com.emm.mygame.core.testing.walkMeaning
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
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
class HoldoutCheckScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<HoldoutCheckIntent> = mutableListOf()

    private var doneTaps: Int = 0

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
                HoldoutCheckScreen(state = state, onIntent = { intents += it }, onDone = { doneTaps += 1 })
            }
        }
    }

    @Test
    fun `draws the check in English under the none scaffold`() {
        composeRule.setContent {
            ProvideCopyLanguage(CopyLanguage(ScaffoldLanguage.None, ChromePhase.Scaffold)) {
                MyGameTheme {
                    HoldoutCheckScreen(state = dueEighthWeek, onIntent = {}, onDone = {})
                }
            }
        }

        composeRule.onNode(wayOn("Start the check")).performScrollTo().assertIsDisplayed()
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
    fun `the check's start is its way on`() {
        showing(dueEighthWeek)

        composeRule.onNode(wayOn(START)).performScrollTo().performClick()

        assertEquals(listOf(HoldoutCheckIntent.StartTapped), intents)
    }

    @Test
    fun `the check's skip stays outlined in the content`() {
        showing(dueEighthWeek)

        composeRule.onNode(
            hasTestTag(OUTLINED_PILL).and(hasText(SKIP)),
        ).assertExists()
    }

    @Test
    fun `an unchosen meaning keeps the check's way on blocked with its reason`() {
        showing(askingLastWordChosen.copy(chosen = emptyMap()))

        composeRule.onNode(wayOn(SEND).and(hasStateDescription(CHOOSE))).assertExists()
    }

    @Test
    fun `after the check its way on returns to what opened it`() {
        showing(HoldoutCheckUiState.Answered)

        composeRule.onNode(wayOn(DONE)).performScrollTo().performClick()

        assertEquals(1, doneTaps)
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
            MyGameTheme {
                HoldoutCheckScreen(state = shown.value, onIntent = {}, onDone = {})
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

        composeRule.onNodeWithText(SKIP).performScrollTo().performClick()

        assertEquals(listOf(HoldoutCheckIntent.SkipTapped), intents)
    }

    @Test
    fun `draws a refused start right above the start`() {
        showing(
            dueEighthWeek.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Begin, HoldoutCheckRefusal.NotOpen),
            ),
        )

        assertVerdictRightAbove(verdict = hasText(NOT_OPEN), control = wayOn(START))
    }

    @Test
    fun `draws a refused skip right above the skip`() {
        showing(
            dueEighthWeek.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Skip, HoldoutCheckRefusal.NotOpen),
            ),
        )

        assertVerdictRightAbove(verdict = hasText(NOT_OPEN), control = skip)
    }

    @Test
    fun `draws the refusal of a refused send right above the send`() {
        showing(
            askingLastWordChosen.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Answers, HoldoutCheckRefusal.NotOpen),
            ),
        )

        assertVerdictRightAbove(verdict = hasText(NOT_OPEN), control = wayOn(SEND))
    }

    @Test
    fun `draws an unreached start right above the start`() {
        showing(dueEighthWeek.copy(request = HoldoutCheckRequest.Unreachable(HoldoutCheckAction.Begin)))

        assertVerdictRightAbove(verdict = hasText(UNREACHABLE), control = wayOn(START))
    }

    @Test
    fun `draws an unreached skip right above the skip`() {
        showing(dueEighthWeek.copy(request = HoldoutCheckRequest.Unreachable(HoldoutCheckAction.Skip)))

        assertVerdictRightAbove(verdict = hasText(UNREACHABLE), control = skip)
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

        composeRule.onNode(wayOn(SEND)).performScrollTo().performClick()

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
    fun `draws the unsaved answers line of an invalid send right above the send`() {
        showing(
            askingLastWordChosen.copy(
                request = HoldoutCheckRequest.Refused(HoldoutCheckAction.Answers, HoldoutCheckRefusal.InvalidRequest),
            ),
        )

        assertVerdictRightAbove(verdict = hasText("No hemos podido guardar tus respuestas."), control = wayOn(SEND))
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
    fun `draws the check not open with its way on`() {
        showing(HoldoutCheckUiState.NotOpen)

        composeRule.onNodeWithText(NOT_OPEN).assertIsDisplayed()
        composeRule.onNode(wayOn(DONE)).assertExists()
    }

    @Test
    fun `holds the choices while the answers are sent`() {
        showing(askingLastWordChosen.copy(request = HoldoutCheckRequest.Waiting(HoldoutCheckAction.Answers)))

        composeRule.onNodeWithText("correr").performScrollTo().assertIsNotEnabled()
    }

    @Test
    fun `draws the start busy while the begin waits`() {
        showing(dueEighthWeek.copy(request = HoldoutCheckRequest.Waiting(HoldoutCheckAction.Begin)))

        composeRule.onNode(hasTestTag(INK_PILL)).assertIsNotEnabled()
    }

    private val skip: SemanticsMatcher = hasTestTag(OUTLINED_PILL).and(hasText(SKIP))

    private fun wayOn(label: String): SemanticsMatcher = hasTestTag(INK_PILL).and(hasCopy(label))

    private fun assertVerdictRightAbove(verdict: SemanticsMatcher, control: SemanticsMatcher) {
        val inScroll: SemanticsMatcher = hasAnyAncestor(hasScrollAction())
        composeRule.onNode(verdict).assert(inScroll)
        composeRule.onNode(control).assert(inScroll)
        val verdictBottom: Dp = composeRule.onNode(verdict).getUnclippedBoundsInRoot().bottom
        val controlTop: Dp = composeRule.onNode(control).getUnclippedBoundsInRoot().top
        assertTrue(verdictBottom <= controlTop)
        assertTrue(controlTop - verdictBottom <= MyGameSpacing.step4)
    }

    private companion object {
        const val START: String = "Empezar la prueba"
        const val SKIP: String = "Saltar la prueba"
        const val SEND: String = "Enviar tus respuestas"
        const val DONE: String = "Continuar"
        const val CHOOSE: String = "Elige un significado para seguir."
        const val NOT_OPEN: String = "Esta prueba no está abierta ahora."
        const val UNREACHABLE: String = "No hemos podido hablar con el servidor. Vuelve a intentarlo en un momento."
    }
}
