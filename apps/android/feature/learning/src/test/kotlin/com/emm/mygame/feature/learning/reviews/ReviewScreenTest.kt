package com.emm.mygame.feature.learning.reviews

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.ReviewHint
import com.emm.mygame.core.model.learning.ReviewHintWord
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "+w411dp-h891dp")
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
    fun `keeps the space typed between the words of a unit`() {
        val intents: MutableList<ReviewIntent> = mutableListOf()
        draw(
            recalling(step = ReviewUiState.ReviewStep.Answering),
            onIntent = { intent: ReviewIntent -> intents += intent },
        )

        composeRule.onNode(hasSetTextAction()).performTextInput("come back")

        assertEquals(listOf<ReviewIntent>(ReviewIntent.AnswerChanged("come back")), intents)
    }

    @Test
    fun `blocks comprobar while the recall field is empty`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Answering))

        composeRule.onNode(wayOn("Comprobar") and hasStateDescription("Escribe tu respuesta para comprobarla."))
            .assertExists()
    }

    @Test
    fun `offers comprobar once the recall field holds an answer`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Answering, typed = "home"))

        composeRule.onNode(wayOn("Comprobar") and hasStateDescription("Escribe tu respuesta para comprobarla."))
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
        draw(recalling(step = ReviewUiState.ReviewStep.Correct(skill = powerSkill, openedLevel = null), typed = "home"))

        composeRule.onNodeWithText("Habilidad ganada: energía, nivel 2.").assertIsDisplayed()
        composeRule.onNodeWithText("+5 % de energía / h.").assertIsDisplayed()
    }

    @Test
    fun `a right answer that opens a level says so right above the way on`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Correct(skill = null, openedLevel = 3), typed = "home"))

        val levelBottom: Dp = composeRule.onNode(hasText(LEVEL_THREE_OPEN) and inScroll, useUnmergedTree = true)
            .getUnclippedBoundsInRoot()
            .bottom
        val wayOnTop: Dp = composeRule.onNode(wayOn("Siguiente") and inScroll).getUnclippedBoundsInRoot().top
        assertTrue(levelBottom <= wayOnTop)
        assertTrue(wayOnTop - levelBottom <= MyGameSpacing.step4)
    }

    @Test
    fun `draws the opened level in English`() {
        drawInEnglish(recalling(step = ReviewUiState.ReviewStep.Correct(skill = null, openedLevel = 3), typed = "home"))

        composeRule.onNodeWithText("You have the words for level 3 now.").assertIsDisplayed()
    }

    @Test
    fun `draws the opened level after the skill lines`() {
        val homeSkill: ReviewUiState.SkillLine = ReviewUiState.SkillLine(
            resource = TownResourceKind.Money,
            level = 1,
            ratePercent = 5,
            rates = null,
            words = listOf("home"),
        )
        draw(recalling(step = ReviewUiState.ReviewStep.Correct(skill = homeSkill, openedLevel = 3), typed = "home"))

        val wordsBottom: Dp =
            composeRule.onNode(hasText("Palabras: home") and isPlaced, useUnmergedTree = true)
                .getUnclippedBoundsInRoot()
                .bottom
        val levelTop: Dp =
            composeRule.onNode(hasText(LEVEL_THREE_OPEN) and isPlaced, useUnmergedTree = true)
                .getUnclippedBoundsInRoot()
                .top
        assertTrue(levelTop >= wordsBottom)
    }

    @Test
    fun `a right answer that opens none adds no level line`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Correct(skill = null, openedLevel = null), typed = "home"))

        composeRule.onNode(hasText("Correcto.") and inScroll).assertExists()
        composeRule.onNodeWithText(LEVEL_THREE_OPEN).assertDoesNotExist()
    }

    @Test
    fun `draws one way on, in the review's flow, while reviewing`() {
        draw(recognizing(chosen = null))

        composeRule.onAllNodes(hasTestTag(INK_PILL)).assertCountEquals(1)
        composeRule.onNode(hasTestTag(INK_PILL) and inScroll).assertExists()
    }

    @Test
    fun `a recognition with no choice keeps the button blocked with its reason`() {
        draw(recognizing(chosen = null))

        composeRule.onNode(
            wayOn("Comprobar") and hasStateDescription("Elige un significado para comprobar tu respuesta."),
        ).assertExists()
    }

    @Test
    @Config(qualifiers = "+w360dp-h480dp")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a new card opens at the top of the review`() {
        val shown: MutableState<ReviewUiState> =
            mutableStateOf(recalling(step = ReviewUiState.ReviewStep.Wrong(correct = "home"), typed = "house"))
        composeRule.setContent {
            MyGameTheme {
                ReviewScreen(state = shown.value, onIntent = {}, onDone = {})
            }
        }
        composeRule.onNode(hasScrollAction()).performTouchInput { swipeUp() }
        composeRule.onNode(hasText("Repaso")).assertIsNotDisplayed()

        shown.value = recognizing(chosen = null)

        composeRule.onNode(hasText("Repaso")).assertIsDisplayed()
    }

    @Test
    @Config(qualifiers = "+w360dp-h480dp")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a returning word opens at the top of the review`() {
        val missed: ReviewUiState.Reviewing =
            recalling(step = ReviewUiState.ReviewStep.Wrong(correct = "home"), typed = "house")
        val shown: MutableState<ReviewUiState> = mutableStateOf(missed)
        composeRule.setContent {
            MyGameTheme {
                ReviewScreen(state = shown.value, onIntent = {}, onDone = {})
            }
        }
        composeRule.onNode(hasScrollAction()).performTouchInput { swipeUp() }
        composeRule.onNode(hasText("Repaso")).assertIsNotDisplayed()

        shown.value = recalling(step = ReviewUiState.ReviewStep.Answering).copy(walked = missed.walked + 1)

        composeRule.onNode(hasText("Repaso")).assertIsDisplayed()
    }

    @Test
    fun `the recall field's done action sends the step`() {
        val intents: MutableList<ReviewIntent> = mutableListOf()
        draw(
            recalling(step = ReviewUiState.ReviewStep.Wrong(correct = "home"), typed = "house"),
            onIntent = { intent: ReviewIntent -> intents += intent },
        )

        composeRule.onNode(hasContentDescription("Tu respuesta en inglés")).performImeAction()

        assertEquals(listOf<ReviewIntent>(ReviewIntent.NextTapped), intents)
    }

    @Test
    fun `reads comprobando while the answer is on its way`() {
        draw(recalling(step = ReviewUiState.ReviewStep.Checking))

        composeRule.onNode(wayOn("Comprobando…")).performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `sends the choice the player taps`() {
        val intents: MutableList<ReviewIntent> = mutableListOf()
        draw(recognizing(chosen = null), onIntent = { intent: ReviewIntent -> intents += intent })

        composeRule.onNodeWithText("escuela").performScrollTo().performClick()

        assertEquals(listOf<ReviewIntent>(ReviewIntent.ChoiceChosen(ChoiceId("4e5f6a7b"))), intents)
    }

    @Test
    fun `draws the reviews due in the body, right above its track`() {
        draw(recognizing(chosen = null))

        val inBody: SemanticsMatcher = isPlaced and hasAnyAncestor(hasScrollAction())
        val count: DpRect = composeRule
            .onNode(hasText("Por repasar: 5") and inBody, useUnmergedTree = true)
            .getUnclippedBoundsInRoot()
        val track: DpRect = composeRule
            .onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.ProgressBarRangeInfo) and isPlaced)
            .getUnclippedBoundsInRoot()
        assertTrue(count.bottom <= track.top)
        assertTrue(track.top - count.bottom <= MyGameSpacing.step2)
    }

    @Test
    fun `retries a failed read from its banner`() {
        val intents: MutableList<ReviewIntent> = mutableListOf()
        draw(ReviewUiState.Failed, onIntent = { intent: ReviewIntent -> intents += intent })

        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<ReviewIntent>(ReviewIntent.RetryTapped), intents)
    }

    private fun recognizing(chosen: ChoiceId?): ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        walked = 0,
        dueCount = 5,
        card = ReviewUiState.ReviewCard.Recognition(
            wordId = schoolRecognition.wordId,
            word = schoolRecognition.word,
            frame = schoolRecognition.frame,
            choices = schoolRecognition.choices,
            chosen = chosen,
            openSpan = null,
        ),
        step = ReviewUiState.ReviewStep.Answering,
        isDealtFromStack = false,
    )

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
            openSpan = null,
        ),
        step = step,
        isDealtFromStack = false,
    )

    private fun draw(state: ReviewUiState, onIntent: (ReviewIntent) -> Unit = {}) {
        composeRule.setContent {
            MyGameTheme {
                ReviewScreen(state = state, onIntent = onIntent, onDone = {})
            }
        }
    }

    private fun drawInEnglish(state: ReviewUiState) {
        composeRule.setContent {
            ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.None, ChromePhase.English)) {
                MyGameTheme {
                    ReviewScreen(state = state, onIntent = {}, onDone = {})
                }
            }
        }
    }

    private companion object {
        const val LEVEL_THREE_OPEN: String = "Ya tienes las palabras para el nivel 3."
    }
}
