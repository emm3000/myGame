package com.emm.mygame.feature.review

import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.intl.LocaleList
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.DueReview
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
class ReviewSupportScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<ReviewIntent> = mutableListOf()

    @Test
    fun `shows the gloss beside a word under 7 days`() {
        draw(recognizing(walkRecognition(caminarBeside)))

        composeRule.onNode(hasText("The kids walk caminar to school.")).assertExists()
    }

    @Test
    fun `draws a gloss beside its word with no control`() {
        draw(recognizing(walkRecognition(caminarBeside)))

        composeRule.onNode(hasText("The kids walk caminar to school.")).assertExists()
        composeRule.onAllNodes(hasClickAction() and hasText("walk")).assertCountEquals(0)
    }

    @Test
    fun `hides the gloss on tap from 7 days until the word is tapped`() {
        draw(recognizing(walkRecognition(caminarOnTap)))

        composeRule.onNode(hasText("walk") and hasClickAction()).assertExists()
        composeRule.onAllNodesWithText("caminar", substring = true).assertCountEquals(0)
    }

    @Test
    fun `shows the gloss on tap from 7 days`() {
        draw(recognizing(walkRecognition(caminarOnTap), openSpan = 1))

        composeRule.onNodeWithText("caminar").assertExists()
    }

    @Test
    fun `shows the definition on tap from 30 days`() {
        draw(recognizing(walkRecognition(walkDefinitionOnTap), openSpan = 1))

        composeRule.onNodeWithText("to move on foot").assertExists()
    }

    @Test
    fun `reads a definition to TalkBack in English`() {
        draw(recognizing(walkRecognition(walkDefinitionOnTap), openSpan = 1))

        assertEquals(LocaleList("en"), localeOf("to move on foot"))
    }

    @Test
    fun `reads a gloss to TalkBack in Spanish`() {
        draw(recognizing(walkRecognition(caminarOnTap), openSpan = 1))

        assertEquals(LocaleList("es"), localeOf("caminar"))
    }

    @Test
    fun `draws a span without support as plain text`() {
        draw(recognizing(schoolRecognition))

        composeRule.onNode(hasText("The kids walk to school.")).assertExists()
        composeRule.onAllNodes(hasClickAction() and hasText("walk")).assertCountEquals(0)
    }

    @Test
    fun `offers no tap on a withheld token`() {
        draw(recognizing(withheldLikeRecognition))

        composeRule.onNode(hasText("Things like this go on in many towns.")).assertExists()
        composeRule.onAllNodes(hasClickAction() and hasText("like", substring = true)).assertCountEquals(0)
    }

    @Test
    fun `asks for the support of the tapped word`() {
        draw(recognizing(walkRecognition(caminarOnTap)))

        composeRule.onNodeWithText("walk").performClick()

        assertEquals(listOf<ReviewIntent>(ReviewIntent.SupportTapped(span = 1)), intents)
    }

    @Test
    fun `chooses no answer when a frame word is tapped`() {
        draw(recognizing(walkRecognition(caminarOnTap)))

        composeRule.onNodeWithText("walk").performClick()

        assertEquals(emptyList<ReviewIntent>(), intents.filterIsInstance<ReviewIntent.ChoiceChosen>())
    }

    @Test
    fun `asks for the support of a word tapped on a recall`() {
        draw(recalling(openSpan = null))

        composeRule.onNodeWithText("goes").performClick()

        assertEquals(listOf<ReviewIntent>(ReviewIntent.SupportTapped(span = 1)), intents)
    }

    @Test
    fun `shows the support opened on a recall`() {
        draw(recalling(openSpan = 1))

        composeRule.onNodeWithText("ir").assertExists()
    }

    @Test
    fun `draws the open support once in the both phase`() {
        draw(
            recognizing(walkRecognition(caminarOnTap), openSpan = 1),
            language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both),
        )

        composeRule.onAllNodesWithText("caminar").assertCountEquals(1)
    }

    private fun localeOf(support: String): LocaleList? {
        val node: SemanticsNode = composeRule.onNodeWithText(support).fetchSemanticsNode()
        val text: AnnotatedString = node.config[SemanticsProperties.Text].single()
        return text.spanStyles.single().item.localeList
    }

    private fun recognizing(due: DueReview.Recognition, openSpan: Int? = null): ReviewUiState.Reviewing =
        ReviewUiState.Reviewing(
            walked = 0,
            dueCount = 1,
            card = ReviewUiState.ReviewCard.Recognition(
                wordId = due.wordId,
                word = due.word,
                frame = due.frame,
                choices = due.choices,
                chosen = null,
                openSpan = openSpan,
            ),
            step = ReviewUiState.ReviewStep.Answering,
            isDealtFromStack = false,
        )

    private fun recalling(openSpan: Int?): ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        walked = 0,
        dueCount = 1,
        card = ReviewUiState.ReviewCard.Recall(
            wordId = goesRecall.wordId,
            gloss = goesRecall.gloss,
            gappedFrame = goesRecall.gappedFrame,
            typed = "",
            hint = null,
            openSpan = openSpan,
        ),
        step = ReviewUiState.ReviewStep.Answering,
        isDealtFromStack = false,
    )

    private fun draw(
        state: ReviewUiState,
        language: CopyLanguage = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
    ) {
        composeRule.setContent {
            ProvideCopyLanguage(language = language) {
                MyGameTheme {
                    ReviewScreen(
                        state = state,
                        onIntent = { intent: ReviewIntent -> intents += intent },
                        onLessonOpen = { },
                        onTownOpen = { },
                    )
                }
            }
        }
    }
}
