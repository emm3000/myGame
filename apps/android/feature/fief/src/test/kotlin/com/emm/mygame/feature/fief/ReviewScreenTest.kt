package com.emm.mygame.feature.fief

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.ReviewHint
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
    fun `reads a hint of one letter in the singular`() {
        val oneLetter: ReviewHint = ReviewHint(firstLetter = "a", letterCount = 1)
        draw(recalling(step = ReviewUiState.ReviewStep.Answering, hint = oneLetter))

        composeRule.onNodeWithText("Empieza por «a» y tiene 1 letra.").assertIsDisplayed()
    }

    @Test
    fun `draws the typed form beside the correct one after a wrong recall`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Wrong(correct = "home"), typed = "house"))

        composeRule.onNodeWithText("Tu respuesta: house").assertIsDisplayed()
        composeRule.onNodeWithText("La correcta: home").assertIsDisplayed()
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
            dueCount = 5,
            card = ReviewUiState.ReviewCard.Recognition(
                wordId = schoolRecognition.wordId,
                word = schoolRecognition.word,
                frame = schoolRecognition.frame,
                choices = schoolRecognition.choices,
                chosen = null,
            ),
            step = ReviewUiState.ReviewStep.Answering,
        )
        draw(recognizing, onIntent = { intent: ReviewIntent -> intents += intent })

        composeRule.onNodeWithText("escuela").performClick()

        assertEquals(listOf<ReviewIntent>(ReviewIntent.ChoiceChosen(ChoiceId("4e5f6a7b"))), intents)
    }

    private fun recalling(
        step: ReviewUiState.ReviewStep,
        typed: String = "",
        hint: ReviewHint? = null,
    ): ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        dueCount = 1,
        card = ReviewUiState.ReviewCard.Recall(
            wordId = homeRecall.wordId,
            gloss = homeRecall.gloss,
            gappedFrame = homeRecall.gappedFrame,
            typed = typed,
            hint = hint,
        ),
        step = step,
    )

    private fun draw(state: ReviewUiState, onIntent: (ReviewIntent) -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                ReviewScreen(state = state, onIntent = onIntent)
            }
        }
    }
}
