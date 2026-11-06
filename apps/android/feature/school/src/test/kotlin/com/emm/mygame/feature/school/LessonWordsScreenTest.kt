package com.emm.mygame.feature.school

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.SemanticsNodeInteractionCollection
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameTheme
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class LessonWordsScreenTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<LessonWordsIntent> = mutableListOf()

    private val wayOns: MutableList<LessonWordsUiState.WayOn> = mutableListOf()

    private var schoolOpenings: Int = 0

    private val finishedFirstWord: LessonWordsUiState.Reading = LessonWordsUiState.Reading(
        number = 1,
        theme = "A day in town",
        words = listOf(homeWord, waterWord),
        index = 0,
        remaining = null,
        wayOn = LessonWordsUiState.WayOn.Reviews,
    )

    private val finishedLastWord: LessonWordsUiState.Reading = finishedFirstWord.copy(index = 1)

    private val runningFirstWord: LessonWordsUiState.Reading =
        finishedFirstWord.copy(remaining = 3.minutes, wayOn = null)

    private val runningLastWord: LessonWordsUiState.Reading = runningFirstWord.copy(index = 1)

    private fun draw(state: LessonWordsUiState) {
        composeRule.setContent {
            MyGameTheme {
                LessonWordsScreen(
                    state = state,
                    onIntent = { intent: LessonWordsIntent -> intents += intent },
                    onWayOn = { wayOn: LessonWordsUiState.WayOn -> wayOns += wayOn },
                    onSchoolOpen = { schoolOpenings += 1 },
                )
            }
        }
    }

    @Test
    fun `shows one word at a time with its gloss and frame`() {
        draw(finishedFirstWord)

        composeRule.onNodeWithText("home").assertExists()
        composeRule.onNodeWithText("hogar").assertExists()
        composeRule.onNodeWithText("This is my home.").assertExists()
        composeRule.onNodeWithText("water").assertDoesNotExist()
    }

    @Test
    fun `sets the word at 44 sp on a phone`() {
        draw(finishedFirstWord)

        assertEquals(44.sp, fontSizeOf("home"))
    }

    @Test
    @Config(qualifiers = "w900dp-h1200dp")
    fun `sets the word at 52 sp on a wide window`() {
        draw(finishedFirstWord)

        assertEquals(52.sp, fontSizeOf("home"))
    }

    @Test
    fun `says which word of the run is on screen`() {
        draw(finishedLastWord)

        composeRule.onNodeWithText("Palabra 2 de 2").assertExists()
    }

    @Test
    fun `moves the progress line with the word`() {
        draw(finishedFirstWord)

        composeRule
            .onNode(SemanticsMatcher.expectValue(SemanticsProperties.ProgressBarRangeInfo, halfWay))
            .assertExists()
    }

    @Test
    fun `draws the place's silhouette where the word names one`() {
        draw(finishedFirstWord.copy(words = listOf(farmWord)))

        composeRule.onNodeWithTag(WORD_SILHOUETTE, useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws no silhouette for a word that names no place`() {
        draw(finishedLastWord)

        composeRule.onNodeWithTag(WORD_SILHOUETTE, useUnmergedTree = true).assertDoesNotExist()
    }

    @Test
    fun `holds at most one ink pill on the words`() {
        val state: MutableState<LessonWordsUiState> = mutableStateOf(finishedFirstWord)
        composeRule.setContent {
            MyGameTheme {
                LessonWordsScreen(state = state.value, onIntent = {}, onWayOn = {}, onSchoolOpen = {})
            }
        }

        val pills: List<Int> = listOf(finishedFirstWord, finishedLastWord, runningFirstWord, runningLastWord)
            .map { shown: LessonWordsUiState ->
                state.value = shown
                composeRule.waitForIdle()
                inkPills().fetchSemanticsNodes().size
            }

        assertEquals(listOf(1, 1, 1, 0), pills)
    }

    @Test
    fun `changes the hue with the next word`() {
        val state: MutableState<LessonWordsUiState> = mutableStateOf(finishedFirstWord)
        composeRule.setContent {
            MyGameTheme {
                LessonWordsScreen(state = state.value, onIntent = {}, onWayOn = {}, onSchoolOpen = {})
            }
        }
        composeRule.onNode(SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Peach)).assertExists()

        state.value = finishedLastWord
        composeRule.waitForIdle()

        composeRule.onNode(SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Mint)).assertExists()
    }

    @Test
    fun `offers no way on while the lesson runs`() {
        draw(runningFirstWord)

        composeRule.onAllNodesWithText("Empezar los repasos").assertCountEquals(0)
    }

    @Test
    fun `shows the time left while the lesson runs`() {
        draw(runningFirstWord)

        composeRule.onNodeWithText("3 min").assertExists()
    }

    @Test
    fun `asks for the next word from the ink pill while the lesson runs`() {
        draw(runningFirstWord)

        composeRule.onNodeWithText("Siguiente palabra").performScrollTo().performClick()

        assertEquals(listOf<LessonWordsIntent>(LessonWordsIntent.NextWordTapped), intents)
    }

    @Test
    fun `makes the way on the ink pill once the lesson has finished`() {
        draw(finishedFirstWord)

        composeRule.onNodeWithTag(INK_PILL).performScrollTo().performClick()

        assertEquals(listOf<LessonWordsUiState.WayOn>(LessonWordsUiState.WayOn.Reviews), wayOns)
    }

    @Test
    fun `keeps the next word as a text link beside the way on`() {
        draw(finishedFirstWord)

        composeRule.onNodeWithText("Siguiente palabra").performScrollTo().performClick()

        assertEquals(listOf<LessonWordsIntent>(LessonWordsIntent.NextWordTapped), intents)
    }

    @Test
    fun `names the next lesson on the way on of a walk`() {
        draw(finishedLastWord.copy(wayOn = LessonWordsUiState.WayOn.Lesson(secondLesson)))

        composeRule.onNodeWithText("Siguiente lección").performScrollTo().performClick()

        assertEquals(listOf<LessonWordsUiState.WayOn>(LessonWordsUiState.WayOn.Lesson(secondLesson)), wayOns)
    }

    @Test
    fun `says the reviews follow on the last word of a running lesson`() {
        draw(runningLastWord)

        composeRule.onNodeWithText("Cuando termine la lección, empiezan los repasos.").assertExists()
    }

    @Test
    fun `offers a way back to the school on the last word of a running lesson`() {
        draw(runningLastWord)

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()

        assertEquals(1, schoolOpenings)
    }

    @Test
    fun `offers a way back to the school when nothing can be read`() {
        draw(LessonWordsUiState.NothingToRead)

        composeRule.onNodeWithText("Ir a la escuela").performScrollTo().performClick()

        assertEquals(1, schoolOpenings)
    }

    @Test
    fun `says so when nothing can be read`() {
        draw(LessonWordsUiState.NothingToRead)

        composeRule.onNodeWithText("Ahora no hay palabras para leer.").assertExists()
    }

    @Test
    fun `draws the loading line`() {
        draw(LessonWordsUiState.Loading)

        composeRule.onNodeWithText("Estamos leyendo tu pueblo…").assertExists()
    }

    @Test
    fun `retries a failed read from its banner`() {
        draw(LessonWordsUiState.Failed)

        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<LessonWordsIntent>(LessonWordsIntent.RetryTapped), intents)
    }

    private fun inkPills(): SemanticsNodeInteractionCollection = composeRule.onAllNodesWithTag(INK_PILL)

    private fun fontSizeOf(text: String): TextUnit {
        val layouts: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true)
            .performSemanticsAction(SemanticsActions.GetTextLayoutResult) {
                    read: (MutableList<TextLayoutResult>) -> Boolean ->
                read(layouts)
            }
        return layouts.first().layoutInput.style.fontSize
    }

    private companion object {
        val halfWay: ProgressBarRangeInfo = ProgressBarRangeInfo(0.5f, 0f..1f)
    }
}
