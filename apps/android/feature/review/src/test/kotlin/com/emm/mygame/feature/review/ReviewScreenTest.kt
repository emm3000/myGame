package com.emm.mygame.feature.review

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.ReviewHintWord
import com.emm.mygame.core.network.TownResourceKind
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReviewScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `gives the recall field its label for TalkBack`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Answering))

        composeRule.onNode(hasSetTextAction() and hasContentDescription("Tu respuesta en inglés")).assertExists()
    }

    @Test
    fun `caps the recall field at the 100 characters the api accepts`() {
        val intents: MutableList<ReviewIntent> = mutableListOf()
        draw(
            recalling(step = ReviewUiState.ReviewStep.Answering),
            onIntent = { intent: ReviewIntent -> intents += intent },
        )

        composeRule.onNode(hasSetTextAction()).performTextInput("a".repeat(101))

        assertEquals(listOf<ReviewIntent>(ReviewIntent.AnswerChanged("a".repeat(100))), intents)
    }

    @Test
    fun `blocks comprobar while the recall field is empty`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Answering))

        composeRule.onNode(hasText("Comprobar") and hasStateDescription("Escribe tu respuesta para comprobarla."))
            .assertExists()
    }

    @Test
    fun `offers comprobar once the recall field holds an answer`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Answering, typed = "home"))

        composeRule.onNode(hasText("Comprobar") and hasStateDescription("Escribe tu respuesta para comprobarla."))
            .assertDoesNotExist()
    }

    @Test
    fun `reads a hint of one letter in the singular`() {
        val oneLetter: ReviewHint = ReviewHint(words = listOf(ReviewHintWord(firstLetter = "a", letterCount = 1)))
        draw(recalling(step = ReviewUiState.ReviewStep.Answering, hint = oneLetter))

        composeRule.onNodeWithText("Empieza por «a» y tiene 1 letra.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws one hint line per word`() {
        val giveUp: ReviewHint = ReviewHint(
            words = listOf(
                ReviewHintWord(firstLetter = "g", letterCount = 4),
                ReviewHintWord(firstLetter = "u", letterCount = 2),
            ),
        )
        draw(recalling(step = ReviewUiState.ReviewStep.Answering, hint = giveUp))

        composeRule.onNodeWithText("Empieza por «g» y tiene 4 letras.").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Empieza por «u» y tiene 2 letras.").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `draws the typed form beside the correct one after a wrong recall`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Wrong(correct = "home"), typed = "house"))

        composeRule.onNodeWithText("Tu respuesta: house").assertIsDisplayed()
        composeRule.onNodeWithText("La correcta: home").assertIsDisplayed()
    }

    @Test
    fun `names the town's resource of the earned skill with its rate line`() {
        val powerSkill: ReviewUiState.SkillLine =
            ReviewUiState.SkillLine(
                resource = TownResourceKind.Power,
                level = 2,
                ratePercent = 5,
                rates = null,
                words = listOf("home"),
            )
        draw(recalling(step = ReviewUiState.ReviewStep.Correct(skill = powerSkill), typed = "home"))

        composeRule.onNodeWithText("Habilidad ganada: energía, nivel 2.").assertIsDisplayed()
        composeRule.onNodeWithText("+5 % de energía / h.").assertIsDisplayed()
    }

    @Test
    fun `reads comprobando while the answer is on its way`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Checking))

        composeRule.onNodeWithText("Comprobando…").assertIsDisplayed()
    }

    @Test
    fun `sends the choice the player taps`() {
        val intents: MutableList<ReviewIntent> = mutableListOf()
        val recognizing: ReviewUiState.Reviewing = ReviewUiState.Reviewing(
            walked = 0,
            dueCount = 5,
            card = ReviewUiState.ReviewCard.Recognition(
                wordId = schoolRecognition.wordId,
                word = schoolRecognition.word,
                frame = schoolRecognition.frame,
                choices = schoolRecognition.choices,
                chosen = null,
            ),
            step = ReviewUiState.ReviewStep.Answering,
            isDealtFromStack = false,
        )
        draw(recognizing, onIntent = { intent: ReviewIntent -> intents += intent })

        composeRule.onNodeWithText("escuela").performClick()

        assertEquals(listOf<ReviewIntent>(ReviewIntent.ChoiceChosen(ChoiceId("4e5f6a7b"))), intents)
    }

    @Test
    fun `retries a failed read from its banner`() {
        val intents: MutableList<ReviewIntent> = mutableListOf()
        draw(ReviewUiState.Failed, onIntent = { intent: ReviewIntent -> intents += intent })

        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<ReviewIntent>(ReviewIntent.RetryTapped), intents)
    }

    private fun recalling(
        step: ReviewUiState.ReviewStep,
        typed: String = "",
        hint: ReviewHint? = null,
    ): ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        walked = 0,
        dueCount = 1,
        card = ReviewUiState.ReviewCard.Recall(
            wordId = homeRecall.wordId,
            gloss = homeRecall.gloss,
            gappedFrame = homeRecall.gappedFrame,
            typed = typed,
            hint = hint,
        ),
        step = step,
        isDealtFromStack = false,
    )

    private fun draw(state: ReviewUiState, onIntent: (ReviewIntent) -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                ReviewScreen(state = state, onIntent = onIntent, onLessonOpen = { }, onTownOpen = { })
            }
        }
    }
}
