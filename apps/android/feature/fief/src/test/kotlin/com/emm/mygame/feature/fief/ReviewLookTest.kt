package com.emm.mygame.feature.fief

import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsAtLeast
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameColors
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.ReviewRefusal
import com.emm.mygame.core.network.TownResourceKind
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class ReviewLookTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private lateinit var colors: MyGameColors

    private val theBlock: SemanticsMatcher = SemanticsMatcher.keyIsDefined(BLOCK_HUE)

    private val recognition: ReviewUiState.ReviewCard.Recognition = ReviewUiState.ReviewCard.Recognition(
        wordId = schoolRecognition.wordId,
        word = schoolRecognition.word,
        frame = schoolRecognition.frame,
        choices = schoolRecognition.choices,
        chosen = schoolRecognition.choices.first().id,
    )

    private val recall: ReviewUiState.ReviewCard.Recall = ReviewUiState.ReviewCard.Recall(
        wordId = homeRecall.wordId,
        gloss = homeRecall.gloss,
        gappedFrame = homeRecall.gappedFrame,
        typed = "house",
        hint = null,
    )

    private val answering: ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        walked = 0,
        dueCount = 4,
        card = recognition,
        step = ReviewUiState.ReviewStep.Answering,
    )

    private val wrongRecall: ReviewUiState.Reviewing =
        answering.copy(card = recall, step = ReviewUiState.ReviewStep.Wrong(correct = "home"))

    private val rightRecall: ReviewUiState.Reviewing =
        answering.copy(card = recall, step = ReviewUiState.ReviewStep.Correct(skill = null))

    @Test
    fun `holds at most one ink pill on a review`() {
        draw(answering.copy(card = recall))

        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
    }

    @Test
    fun `holds at most one ink pill on a rated review`() {
        draw(rightRecall)

        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
    }

    @Test
    fun `holds no ink pill on a failed read beyond its retry`() {
        draw(ReviewUiState.Failed)

        composeRule.onAllNodes(hasTestTag(INK_PILL) and hasAnyAncestor(theBlock)).assertCountEquals(0)
    }

    @Test
    fun `sets the word on a block`() {
        draw(answering)

        composeRule.onNode(hasText("school") and theBlock).assertExists()
    }

    @Test
    fun `sets the frame on the block`() {
        draw(answering)

        composeRule.onNode(hasText("The kids walk to school.") and theBlock).assertExists()
    }

    @Test
    fun `sets the frame in reading on the block's ink`() {
        draw(answering)

        assertEquals(20.sp, styleOf("The kids walk to school.").fontSize)
        assertEquals(colors.onBlock, styleOf("The kids walk to school.").color)
    }

    @Test
    fun `sets the word at 44 sp on a phone`() {
        draw(answering)

        assertEquals(44.sp, styleOf("school").fontSize)
    }

    @Test
    @Config(qualifiers = "w900dp-h1200dp")
    fun `sets the word at 52 sp on a wide window`() {
        draw(answering)

        assertEquals(52.sp, styleOf("school").fontSize)
    }

    @Test
    @Config(qualifiers = "w900dp-h1200dp")
    fun `sets a recall's cue at 52 sp on a wide window`() {
        draw(answering.copy(card = recall))

        assertEquals(52.sp, styleOf("casa").fontSize)
    }

    @Test
    fun `changes the hue with the next card`() {
        draw(answering.copy(walked = 1))

        composeRule.onNode(hasText("school") and SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Mint))
            .assertExists()
    }

    @Test
    fun `starts a run on the first hue`() {
        draw(answering)

        composeRule.onNode(hasText("school") and SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Peach))
            .assertExists()
    }

    @Test
    fun `cycles the hue past the fourth card`() {
        draw(answering.copy(walked = 5))

        composeRule.onNode(hasText("school") and SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Mint))
            .assertExists()
    }

    @Test
    fun `draws the progress line above the block`() {
        draw(answering)

        val lineBottom: Dp = composeRule.onNode(hasProgress(current = 0f)).getUnclippedBoundsInRoot().bottom
        val blockTop: Dp = composeRule.onNode(theBlock).getUnclippedBoundsInRoot().top
        assertTrue(lineBottom <= blockTop)
    }

    @Test
    fun `moves the progress line with the cards walked`() {
        draw(answering.copy(walked = 1, dueCount = 3))

        composeRule.onNode(hasProgress(current = 0.25f)).assertExists()
    }

    @Test
    fun `moves the progress line on a rated card`() {
        draw(rightRecall.copy(walked = 1, dueCount = 3))

        composeRule.onNode(hasProgress(current = 0.5f)).assertExists()
    }

    @Test
    fun `holds a choice row at 52 tall`() {
        draw(answering)

        composeRule.onNode(hasText("escuela") and SemanticsMatcher.keyIsDefined(SemanticsProperties.Selected))
            .assertHeightIsAtLeast(MyGameSizes.secondary)
    }

    @Test
    fun `sets a choice in gloss`() {
        draw(answering)

        assertEquals(17.sp, styleOf("escuela").fontSize)
    }

    @Test
    fun `sets the chosen gloss in bold`() {
        draw(answering)

        assertEquals(FontWeight.Bold, styleOf("dinero").fontWeight)
    }

    @Test
    fun `draws a right answer as a check and words in ink`() {
        draw(rightRecall)

        composeRule.onNodeWithTag(RIGHT_ICON, useUnmergedTree = true).assertExists()
        assertEquals(colors.ink, styleOf("Correcto.").color)
    }

    @Test
    fun `draws a wrong answer as a cross and the right answer in ink`() {
        draw(wrongRecall)

        composeRule.onNodeWithTag(WRONG_ICON, useUnmergedTree = true).assertExists()
        assertEquals(colors.ink, styleOf("No es correcto.").color)
        assertEquals(colors.ink, styleOf("La correcta: home").color)
    }

    @Test
    fun `sets the right form in bold inside its line`() {
        draw(wrongRecall)

        val bold: AnnotatedString.Range<SpanStyle> = textOf("La correcta: home").spanStyles.single()
        assertEquals(FontWeight.Bold, bold.item.fontWeight)
        assertEquals("home", textOf("La correcta: home").substring(bold.start, bold.end))
    }

    @Test
    fun `draws no cross on a right answer`() {
        draw(rightRecall)

        composeRule.onAllNodesWithTag(WRONG_ICON, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `draws no check on a wrong answer`() {
        draw(wrongRecall)

        composeRule.onAllNodesWithTag(RIGHT_ICON, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `sets the player's answer and the word's return in ink`() {
        draw(wrongRecall)

        assertEquals(colors.ink, styleOf("Tu respuesta: house").color)
        assertEquals(colors.ink, styleOf("Esta palabra volverá en unos minutos.").color)
    }

    @Test
    fun `sets an earned skill's lines in ink`() {
        val skill: ReviewUiState.SkillLine =
            ReviewUiState.SkillLine(
                resource = TownResourceKind.Food,
                level = 1,
                ratePercent = 5,
                rates = null,
                words = listOf("home"),
            )
        draw(rightRecall.copy(step = ReviewUiState.ReviewStep.Correct(skill = skill)))

        assertEquals(colors.ink, styleOf("Habilidad ganada: comida, nivel 1.").color)
        assertEquals(colors.ink, styleOf("+5 % de comida / h.").color)
    }

    @Test
    fun `draws a near miss in ink`() {
        draw(answering.copy(card = recall, step = ReviewUiState.ReviewStep.NearMiss))

        assertEquals(colors.ink, styleOf("Casi. Revisa cómo se escribe y vuelve a comprobar.").color)
    }

    @Test
    fun `keeps a refusal in the destructive ink`() {
        draw(answering.copy(step = ReviewUiState.ReviewStep.Refused(ReviewRefusal.HintOnRecognition)))

        assertEquals(colors.destructiveInk, styleOf(hintOnRecognition).color)
    }

    @Test
    fun `offers the hint under the check`() {
        draw(answering.copy(card = recall))

        val pillBottom: Dp = composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot().bottom
        val hintTop: Dp = composeRule.onNodeWithTag(OUTLINED_PILL).getUnclippedBoundsInRoot().top
        assertTrue(pillBottom <= hintTop)
    }

    @Test
    fun `sets a given hint under the check`() {
        draw(answering.copy(card = recall.copy(hint = ReviewHint(firstLetter = "h", letterCount = 4))))

        val pillBottom: Dp = composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot().bottom
        val hintTop: Dp = composeRule.onNodeWithText("Empieza por «h» y tiene 4 letras.")
            .getUnclippedBoundsInRoot().top
        assertTrue(pillBottom <= hintTop)
    }

    @Test
    fun `leaves the hint out of a rated recall`() {
        draw(wrongRecall.copy(card = recall.copy(hint = ReviewHint(firstLetter = "h", letterCount = 4))))

        composeRule.onNodeWithText("Empieza por «h» y tiene 4 letras.").assertDoesNotExist()
    }

    private val hintOnRecognition: String =
        "Esta palabra se elige entre opciones y no lleva pista. La pista llega cuando toca escribirla."

    private fun hasProgress(current: Float): SemanticsMatcher = SemanticsMatcher.expectValue(
        SemanticsProperties.ProgressBarRangeInfo,
        ProgressBarRangeInfo(current = current, range = 0f..1f),
    )

    private fun layoutOf(text: String): TextLayoutResult {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first()
    }

    private fun styleOf(text: String): TextStyle = layoutOf(text).layoutInput.style

    private fun textOf(text: String): AnnotatedString = layoutOf(text).layoutInput.text

    private fun draw(state: ReviewUiState) {
        composeRule.setContent {
            MyGameTheme {
                colors = MyGameTheme.colors
                ReviewScreen(state = state, onIntent = { }, onLessonOpen = { }, onTownOpen = { })
            }
        }
    }
}
