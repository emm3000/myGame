package com.emm.mygame.feature.school

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasScrollAction
import androidx.compose.ui.test.hasStateDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.SemanticsNodeInteractionCollection
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.DpRect
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.FRAME_STYLE
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.ui.TaskDockHook
import kotlin.time.Duration.Companion.minutes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
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

    private val hook: TaskDockHook = TaskDockHook(onAnswered = {})

    private val finishedFirstWord: LessonWordsUiState.Reading = LessonWordsUiState.Reading(
        name = LessonName.Shelved(number = 1),
        theme = "A day in town",
        words = listOf(homeWord, waterWord),
        index = 0,
        remaining = null,
        wayOn = LessonWordsUiState.WayOn.Reviews,
        shownSupport = null,
        isNextStepThisLesson = false,
    )

    private val finishedLastWord: LessonWordsUiState.Reading = finishedFirstWord.copy(index = 1)

    private val runningFirstWord: LessonWordsUiState.Reading =
        finishedFirstWord.copy(remaining = 3.minutes, wayOn = null)

    private val runningLastWord: LessonWordsUiState.Reading = runningFirstWord.copy(index = 1)

    private val waitingLastWord: LessonWordsUiState.Reading = runningLastWord.copy(isNextStepThisLesson = true)

    private fun draw(state: LessonWordsUiState) {
        composeRule.setContent {
            MyGameTheme {
                LessonWordsWithDock(
                    state = state,
                    onIntent = { intent: LessonWordsIntent -> intents += intent },
                    onWayOn = { wayOn: LessonWordsUiState.WayOn -> wayOns += wayOn },
                    onSchoolOpen = { schoolOpenings += 1 },
                    hook = hook,
                )
            }
        }
    }

    @Test
    fun `shows one word at a time with its gloss and frame`() {
        draw(finishedFirstWord)

        composeRule.onNodeWithText("home hogar").assertExists()
        composeRule.onNodeWithText("This is my home.").assertExists()
        composeRule.onNodeWithText("water").assertDoesNotExist()
    }

    @Test
    fun `sets the word at 44 sp on a phone`() {
        draw(finishedFirstWord)

        assertEquals(44.sp, headingFontSize())
    }

    @Test
    @Config(qualifiers = "+w900dp-h1200dp")
    fun `sets the word at 52 sp on a wide window`() {
        draw(finishedFirstWord)

        assertEquals(52.sp, headingFontSize())
    }

    @Test
    @Config(qualifiers = "+w411dp-h891dp")
    fun `draws the word's position in the body, right above its track`() {
        draw(finishedFirstWord.copy(words = listOf(homeWord, waterWord, farmWord), index = 1))

        val position: DpRect = composeRule
            .onNode(hasText("Palabra 2 de 3") and hasAnyAncestor(hasScrollAction()), useUnmergedTree = true)
            .getUnclippedBoundsInRoot()
        val track: DpRect = composeRule
            .onNode(SemanticsMatcher.keyIsDefined(SemanticsProperties.ProgressBarRangeInfo))
            .getUnclippedBoundsInRoot()
        assertTrue(position.bottom <= track.top)
        assertTrue(track.top - position.bottom <= MyGameSpacing.step2)
    }

    @Test
    @Config(qualifiers = "+w411dp-h891dp")
    fun `draws the lesson's time left in the body while it waits for the lesson's end`() {
        draw(waitingLastWord)

        composeRule.onNode(hasText("3 min") and hasAnyAncestor(hasScrollAction())).assertExists()
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
                LessonWordsWithDock(state = state.value)
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
                LessonWordsWithDock(state = state.value)
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
    fun `sets the slot's title beside the hourglass in caption on the muted ink`() {
        var muted: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                muted = MyGameTheme.colors.inkMuted
                LessonWordsWithDock(state = runningFirstWord)
            }
        }

        val title: TextStyle = textStyleOf(composeRule, "En estudio")
        assertEquals(15.sp, title.fontSize)
        assertEquals(FontWeight.Normal, title.fontWeight)
        assertEquals(muted, title.color)
    }

    @Test
    fun `asks for the next word from the dock while the lesson runs`() {
        draw(runningFirstWord)

        dockGo("Siguiente palabra").performClick()

        assertEquals(listOf<LessonWordsIntent>(LessonWordsIntent.NextWordTapped), intents)
    }

    @Test
    fun `opens the reviews from the way on's nav row before the last word`() {
        draw(finishedFirstWord)

        composeRule.onNode(navRowOf("Empezar los repasos"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(listOf<LessonWordsUiState.WayOn>(LessonWordsUiState.WayOn.Reviews), wayOns)
    }

    @Test
    fun `opens the next lesson from the way on's nav row before the last word`() {
        draw(finishedFirstWord.copy(wayOn = LessonWordsUiState.WayOn.Lesson(secondLesson)))

        composeRule.onNode(navRowOf("Siguiente lección"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(listOf<LessonWordsUiState.WayOn>(LessonWordsUiState.WayOn.Lesson(secondLesson)), wayOns)
    }

    @Test
    fun `asks for the next word from the dock beside the way on`() {
        draw(finishedFirstWord)

        dockGo("Siguiente palabra").performClick()

        assertEquals(listOf<LessonWordsIntent>(LessonWordsIntent.NextWordTapped), intents)
    }

    @Test
    fun `names the next lesson on the dock's go of a walk's last word`() {
        draw(finishedLastWord.copy(wayOn = LessonWordsUiState.WayOn.Lesson(secondLesson)))

        dockGo("Siguiente lección").performClick()

        assertEquals(listOf<LessonWordsUiState.WayOn>(LessonWordsUiState.WayOn.Lesson(secondLesson)), wayOns)
    }

    @Test
    fun `says the reviews follow on the last word of a running lesson`() {
        draw(runningLastWord)

        composeRule.onNodeWithText("Cuando termine la lección, empiezan los repasos.").assertExists()
    }

    @Test
    fun `opens the school from a nav row on the last word of a running lesson`() {
        draw(runningLastWord)

        composeRule.onNode(navRowOf("Ir a la escuela"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(1, schoolOpenings)
    }

    @Test
    @Config(qualifiers = "+w411dp-h891dp")
    fun `the last word with no way on waits for the lesson's end and sends nothing`() {
        draw(waitingLastWord)

        composeRule.onNode(
            hasContentDescription("Empezar los repasos", substring = true) and
                hasStateDescription("Cuando termine la lección, empiezan los repasos.") and
                hasAnyAncestor(hasTestTag(TASK_DOCK)),
        ).performClick()

        assertEquals(emptyList<LessonWordsIntent>(), intents)
        assertEquals(emptyList<LessonWordsUiState.WayOn>(), wayOns)
    }

    @Test
    @Config(qualifiers = "+w411dp-h891dp")
    fun `draws no time left in the dock while it waits for the lesson's end`() {
        draw(waitingLastWord)

        composeRule.onAllNodes(hasText("3 min") and hasAnyAncestor(hasTestTag(TASK_DOCK))).assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    fun `draws the time left and the position once at font scale 2 on a 360 by 640 window`() {
        draw(waitingLastWord)

        val inBody: SemanticsMatcher = hasAnyAncestor(hasScrollAction()) and !hasAnyAncestor(hasTestTag(TASK_DOCK))
        composeRule.onAllNodes(hasText("3 min") and inBody).assertCountEquals(1)
        composeRule.onAllNodes(hasText("2 de 2", substring = true) and inBody).assertCountEquals(1)
    }

    @Test
    fun `follows the town's step on the last word while the step is elsewhere`() {
        draw(runningLastWord)

        composeRule.runOnIdle { assertNotNull(hook.town) }
    }

    @Test
    fun `opens the school from a nav row when nothing can be read`() {
        draw(LessonWordsUiState.NothingToRead)

        composeRule.onNode(navRowOf("Ir a la escuela"), useUnmergedTree = true).performScrollTo().performClick()

        assertEquals(1, schoolOpenings)
    }

    @Test
    fun `says so when nothing can be read`() {
        draw(LessonWordsUiState.NothingToRead)

        composeRule.onNodeWithText("Ahora no hay palabras para leer.").assertExists()
    }

    @Test
    fun `retries a failed read from its banner`() {
        draw(LessonWordsUiState.Failed)

        composeRule.onNodeWithText("Volver a intentarlo").performClick()

        assertEquals(listOf<LessonWordsIntent>(LessonWordsIntent.RetryTapped), intents)
    }

    private fun dockGo(label: String): SemanticsNodeInteraction = composeRule.onNode(
        hasTestTag(INK_PILL) and
            hasContentDescription(label, substring = true) and
            hasAnyAncestor(hasTestTag(TASK_DOCK)),
    )

    private fun inkPills(): SemanticsNodeInteractionCollection = composeRule.onAllNodesWithTag(INK_PILL)

    private fun headingFontSize(): TextUnit =
        composeRule.onNode(hasText("home hogar") and SemanticsMatcher.keyIsDefined(FRAME_STYLE))
            .fetchSemanticsNode().config[FRAME_STYLE].fontSize

    private companion object {
        val halfWay: ProgressBarRangeInfo = ProgressBarRangeInfo(0.5f, 0f..1f)
    }
}
