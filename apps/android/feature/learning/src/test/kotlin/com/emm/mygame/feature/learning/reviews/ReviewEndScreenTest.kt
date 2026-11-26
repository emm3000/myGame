package com.emm.mygame.feature.learning.reviews

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.intl.LocaleList
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReviewEndScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private var doneTaps: Int = 0

    private val lessonTwoPath: ReviewUiState.LessonPath = ReviewUiState.LessonPath(
        number = 2,
        counts = SchoolPathCounts(held = 4, read = 3, reviewed = 1, learned = 0),
    )

    private val theBlock: SemanticsMatcher = SemanticsMatcher.keyIsDefined(BLOCK_HUE)

    @Test
    fun `the way on returns to what opened the reviews at the review's end`() {
        draw(nothingDue(path = lessonTwoPath))

        composeRule.onNode(wayOn(CONTINUE)).performScrollTo().performClick()

        assertEquals(1, doneTaps)
    }

    @Test
    fun `the way on returns to what opened the reviews for a player with no cards`() {
        draw(ReviewUiState.NoCards)

        composeRule.onNode(wayOn(CONTINUE)).performScrollTo().performClick()

        assertEquals(1, doneTaps)
    }

    @Test
    fun `draws no next review, which the Report states`() {
        composeRule.setContent {
            MyGameTheme {
                ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English)) {
                    ReviewScreen(state = nothingDue(path = lessonTwoPath), onIntent = {}, onDone = {})
                }
            }
        }

        composeRule.onAllNodes(hasText("Next review:", substring = true) and isPlaced, useUnmergedTree = true)
            .assertCountEquals(0)
    }

    @Test
    fun `keeps the nothing-due line on the card at the review's end`() {
        draw(nothingDue(path = lessonTwoPath))

        composeRule.onNodeWithText("No tienes nada que repasar ahora.").assertIsDisplayed()
    }

    @Test
    fun `shows the school path at the review's end`() {
        draw(nothingDue(path = lessonTwoPath))

        listOf(
            "Lección 2",
            "Estudiadas",
            "4 de 4",
            "Puedes leer",
            "3 de 4",
            "Repasadas",
            "1 de 4",
        ).forEach { line: String ->
            composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
        }
    }

    @Test
    fun `shows no school path with no path to show`() {
        draw(nothingDue(path = null))

        composeRule.onAllNodesWithText("Estudiadas").assertCountEquals(0)
    }

    @Test
    fun `shows no school path to a player with no cards`() {
        draw(ReviewUiState.NoCards)

        composeRule.onAllNodesWithText("Estudiadas").assertCountEquals(0)
    }

    @Test
    fun `draws one way on, in the review's flow, at the review's end`() {
        draw(nothingDue(path = lessonTwoPath))

        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
        composeRule.onNode(wayOn(CONTINUE) and inScroll).assertExists()
    }

    @Test
    fun `names the lesson that finished during the reviews`() {
        draw(ReviewUiState.LessonReady(lesson = lessonTwo, number = 2))

        composeRule.onNode(hasText("La lección 2 está lista") and hasAnyAncestor(theBlock)).assertIsDisplayed()
    }

    @Test
    fun `sets the finished lesson on its place in the curriculum`() {
        draw(ReviewUiState.LessonReady(lesson = lessonTwo, number = 2))

        composeRule.onNode(SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Mint)).assertIsDisplayed()
    }

    @Test
    fun `the way on returns to what opened the reviews once a lesson finishes during them`() {
        draw(ReviewUiState.LessonReady(lesson = lessonTwo, number = 2))

        composeRule.onNode(wayOn(CONTINUE)).performScrollTo().performClick()

        assertEquals(1, doneTaps)
    }

    @Test
    fun `names no lesson while the town is unread`() {
        draw(ReviewUiState.LessonReady(lesson = lessonTwo, number = null))

        composeRule.onAllNodesWithText("La lección", substring = true).assertCountEquals(0)
    }

    @Test
    fun `shows the rates and the lesson's words on the skill verdict`() {
        draw(correctWith(ReviewUiState.SkillRates(before = 120, after = 126)))

        composeRule.onNodeWithText("Energía: +120 / h, ahora +126 / h").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Palabras: home, school").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `sets the lesson's words in English`() {
        draw(correctWith(rates = null))

        val words: AnnotatedString = layoutOf("Palabras: home, school").layoutInput.text

        val english: AnnotatedString.Range<*> = words.spanStyles.single()
        assertEquals(LocaleList("en"), (english.item as SpanStyle).localeList)
        assertEquals("home, school", words.text.substring(english.start, english.end))
    }

    @Test
    fun `keeps the percent line with no town`() {
        draw(correctWith(rates = null))

        composeRule.onNodeWithText("+5 % de energía / h.").performScrollTo().assertIsDisplayed()
        composeRule.onAllNodesWithText("ahora", substring = true).assertCountEquals(0)
    }

    private fun nothingDue(path: ReviewUiState.LessonPath?): ReviewUiState.NothingDue =
        ReviewUiState.NothingDue(dueAt = firstReadAt + 9.minutes, path = path)

    private fun correctWith(rates: ReviewUiState.SkillRates?): ReviewUiState.Reviewing = ReviewUiState.Reviewing(
        walked = 0,
        dueCount = 1,
        card = ReviewUiState.ReviewCard.Recall(
            wordId = homeRecall.wordId,
            gloss = homeRecall.gloss,
            gappedFrame = homeRecall.gappedFrame,
            typed = "home",
            hint = null,
            openSpan = null,
        ),
        step = ReviewUiState.ReviewStep.Correct(
            skill = ReviewUiState.SkillLine(
                resource = TownResourceKind.Power,
                level = 1,
                ratePercent = 5,
                rates = rates,
                words = listOf("home", "school"),
            ),
            openedLevel = null,
        ),
        isDealtFromStack = false,
    )

    private fun layoutOf(text: String): TextLayoutResult {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNode(hasText(text) and isPlaced, useUnmergedTree = true)
            .fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult]
            .action
            ?.invoke(layouts)
        return layouts.first()
    }

    private companion object {
        const val CONTINUE: String = "Continuar"
    }

    private fun draw(state: ReviewUiState) {
        composeRule.setContent {
            MyGameTheme {
                ReviewScreen(state = state, onIntent = {}, onDone = { doneTaps += 1 })
            }
        }
    }
}
