package com.emm.mygame.feature.school

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.emm.mygame.core.designsystem.BLOCK_HUE
import com.emm.mygame.core.designsystem.HAIRLINE
import com.emm.mygame.core.designsystem.INK_PILL
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.OUTLINED_PILL
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownResourceKind
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class SchoolLookTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val intents: MutableList<SchoolIntent> = mutableListOf()

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private var reviewOpens: Int = 0

    private val thirdLesson: LessonId = LessonId("lesson-3")

    private val openFirst: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
        lesson = firstLesson,
        number = 1,
        theme = "A day in town",
        wordCount = 5,
        resource = TownResourceKind.Food,
        ratePercent = 5,
        duration = 150.seconds,
        state = SchoolUiState.LessonState.Open(block = null),
    )

    private val openSecond: SchoolUiState.LessonCard =
        openFirst.copy(lesson = secondLesson, number = 2, theme = "Work and money")

    private val openThird: SchoolUiState.LessonCard =
        openFirst.copy(lesson = thirdLesson, number = 3, theme = "The market")

    private val studiedFirst: SchoolUiState.LessonCard = openFirst.copy(state = SchoolUiState.LessonState.Studied)

    private val studiedSecond: SchoolUiState.LessonCard = openSecond.copy(state = SchoolUiState.LessonState.Studied)

    private val runningFirst: SchoolUiState.LessonCard = openFirst.copy(state = SchoolUiState.LessonState.Studying)

    private val busyOnFirst: SchoolUiState.LessonState.Open =
        SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SlotBusy(number = 1))

    private val firstRunning: SchoolUiState.SlotLine.Busy =
        SchoolUiState.SlotLine.Busy(firstLesson, number = 1, remaining = 90.seconds, total = 150.seconds)

    private val idleSchool: SchoolUiState.Content = SchoolUiState.Content(
        schoolLevel = 1,
        learning = SchoolUiState.LearningLine(inLearning = 0, cap = 10, wordsPastCap = null),
        slot = SchoolUiState.SlotLine.Idle,
        skills = emptyList(),
        lessons = listOf(openFirst, openSecond, openThird),
        start = SchoolUiState.LessonRequest.Idle,
        stop = SchoolUiState.LessonRequest.Idle,
    )

    private val secondWhileFirstRuns: SchoolUiState.Content = idleSchool.copy(
        slot = firstRunning,
        lessons = listOf(runningFirst, openSecond.copy(state = busyOnFirst)),
    )

    private val theBlock: SemanticsMatcher = SemanticsMatcher.keyIsDefined(BLOCK_HUE)

    private val inTheBlock: SemanticsMatcher = hasAnyAncestor(theBlock)

    @Test
    fun `holds one ink pill on the school`() {
        show(idleSchool)

        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
    }

    @Test
    fun `holds one ink pill while a lesson runs`() {
        show(secondWhileFirstRuns)

        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
    }

    @Test
    fun `holds one ink pill with every lesson studied`() {
        show(idleSchool.copy(lessons = listOf(studiedFirst, studiedSecond)))

        composeRule.onAllNodesWithTag(INK_PILL).assertCountEquals(1)
    }

    @Test
    fun `puts the next lesson in a block with its pill under it`() {
        show(idleSchool)

        composeRule.onNode(hasText("Lección 1") and theBlock).assertExists()
        val blockBottom: Dp = composeRule.onNode(theBlock)
            .getUnclippedBoundsInRoot().bottom
        val pillTop: Dp = composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot().top
        assertTrue(blockBottom <= pillTop)
        composeRule.onAllNodes(hasTestTag(INK_PILL) and inTheBlock).assertCountEquals(0)
    }

    @Test
    fun `sets the lesson in display and its theme in reading on the block's ink`() {
        val (ink: Color, muted: Color) = showReadingBlockInks(idleSchool.copy(lessons = listOf(openFirst)))

        assertEquals(40.sp, textStyleOf("Lección 1").fontSize)
        assertEquals(ink, textStyleOf("Lección 1").color)
        assertEquals(20.sp, textStyleOf("A day in town").fontSize)
        assertEquals(muted, textStyleOf("5 palabras · +5 % de comida").color)
    }

    @Test
    fun `takes the block's hue from the lesson's place in the curriculum`() {
        show(idleSchool.copy(lessons = listOf(studiedFirst, studiedSecond, openThird)))

        composeRule.onNode(
            hasText("Lección 3") and SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Periwinkle),
        ).assertExists()
    }

    @Test
    fun `opens the block on the first open lesson past a running one`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(hasText("Lección 2") and theBlock).assertExists()
    }

    @Test
    fun `shows the running lesson in the block when no other is open`() {
        show(idleSchool.copy(slot = firstRunning, lessons = listOf(runningFirst, studiedSecond)))

        composeRule.onNode(hasText("Lección 1") and theBlock).assertExists()
        composeRule.onNode(hasText("En estudio") and theBlock).assertExists()
    }

    @Test
    fun `draws the learning load under the pill and the rows under the load`() {
        show(idleSchool)

        val pillBottom: Dp = composeRule.onNodeWithTag(INK_PILL).getUnclippedBoundsInRoot().bottom
        val loadTop: Dp = composeRule.onNodeWithText("Palabras en aprendizaje: 0 de 10")
            .getUnclippedBoundsInRoot().top
        val rowsTop: Dp = composeRule.onNodeWithText("Lecciones").getUnclippedBoundsInRoot().top
        assertTrue(pillBottom <= loadTop)
        assertTrue(loadTop < rowsTop)
    }

    @Test
    fun `sets the other lessons on rows split by hairlines`() {
        show(idleSchool)

        composeRule.onNodeWithText("Lección 2").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithText("Lección 3").performScrollTo().assertIsDisplayed()
        composeRule.onAllNodesWithTag(HAIRLINE, useUnmergedTree = true).assertCountEquals(1)
    }

    @Test
    fun `selects a lesson from its row`() {
        show(idleSchool)

        composeRule.onNodeWithText("Lección 2").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.LessonSelected(secondLesson)), intents)
    }

    @Test
    fun `selects the running lesson from its row`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(hasText("Lección 1") and hasClickAction()).performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.LessonSelected(firstLesson)), intents)
    }

    @Test
    fun `keeps a studied row plain`() {
        show(idleSchool.copy(lessons = listOf(studiedFirst, openSecond)))

        composeRule.onNode(hasText("Lección 1") and hasClickAction()).assertDoesNotExist()
        composeRule.onNodeWithText("Estudiada").performScrollTo().assertIsDisplayed()
    }

    @Test
    fun `gives a selected row the block`() {
        show(idleSchool.copy(selected = thirdLesson))

        composeRule.onNode(hasText("Lección 3") and theBlock).assertExists()
    }

    @Test
    fun `gives a selected row the pill`() {
        show(idleSchool.copy(selected = thirdLesson))

        composeRule.onNode(hasTestTag(INK_PILL) and hasText("Estudiar la lección 3 · 2:30")).assertExists()
    }

    @Test
    fun `keeps the hue of a selected lesson's place`() {
        show(idleSchool.copy(selected = secondLesson))

        composeRule.onNode(SemanticsMatcher.expectValue(BLOCK_HUE, MyGameBlockHue.Mint)).assertExists()
    }

    @Test
    fun `moves the lesson the block left down to the rows`() {
        show(idleSchool.copy(selected = thirdLesson))

        composeRule.onNodeWithText("Lección 1").performScrollTo().performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.LessonSelected(firstLesson)), intents)
    }

    @Test
    fun `brings the block back into view on a selection`() {
        var state: SchoolUiState by mutableStateOf(idleSchool)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(state = state, onIntent = { }, onReviewsOpen = { }, onLessonOpen = { })
            }
        }
        composeRule.onNodeWithText("Aún no tienes habilidades.").performScrollTo()

        state = idleSchool.copy(selected = thirdLesson)

        composeRule.onNode(hasText("Lección 3") and theBlock).assertIsDisplayed()
    }

    @Test
    fun `quiets the study pill while a lesson runs`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(hasTestTag(OUTLINED_PILL) and hasText("Estudiar la lección 2 · 2:30")).assertExists()
    }

    @Test
    fun `names the running lesson on the pill while the block shows another`() {
        show(secondWhileFirstRuns)

        composeRule.onNode(hasTestTag(INK_PILL) and hasText("Lección 1 · Leer las palabras")).assertExists()
    }

    @Test
    fun `opens the running lesson from the pill under another lesson's block`() {
        show(secondWhileFirstRuns)

        composeRule.onNodeWithTag(INK_PILL).performClick()

        assertEquals(listOf(firstLesson), lessonOpens)
    }

    @Test
    fun `leaves the running lesson unnamed on the pill under its own block`() {
        show(secondWhileFirstRuns.copy(selected = firstLesson))

        composeRule.onNode(hasTestTag(INK_PILL) and hasText("Leer las palabras")).assertExists()
    }

    @Test
    fun `keeps the pill on a lesson that finished while the town reads again`() {
        show(secondWhileFirstRuns.copy(slot = SchoolUiState.SlotLine.Done(firstLesson, number = 1)))

        composeRule.onNode(hasTestTag(INK_PILL) and hasText("Lección 1 · Leer las palabras")).assertExists()
    }

    @Test
    fun `sets the stop control beside the slot as a secondary pill`() {
        show(secondWhileFirstRuns)

        composeRule
            .onNode(hasTestTag(OUTLINED_PILL) and hasContentDescription("Parar el estudio de la lección 1"))
            .assertExists()
    }

    @Test
    fun `sets a running lesson's countdown in heading`() {
        show(secondWhileFirstRuns)

        assertEquals(20.sp, textStyleOf("1 min").fontSize)
    }

    @Test
    fun `sets a running lesson's countdown in tabular figures`() {
        show(secondWhileFirstRuns)

        assertEquals("tnum", textStyleOf("1 min").fontFeatureSettings)
    }

    @Test
    fun `carries its icon on a done line`() {
        show(idleSchool.copy(slot = SchoolUiState.SlotLine.Done(firstLesson, number = 1)))

        composeRule.onNodeWithTag(LESSON_DONE_ICON, useUnmergedTree = true).assertExists()
    }

    @Test
    fun `draws no done icon on a running lesson`() {
        show(secondWhileFirstRuns)

        composeRule.onAllNodesWithTag(LESSON_DONE_ICON, useUnmergedTree = true).assertCountEquals(0)
    }

    @Test
    fun `says why the next lesson is locked in warning ink`() {
        val locked: SchoolUiState.LessonState.Open =
            SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2))
        var warningInk: Color = Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                warningInk = MyGameTheme.colors.warningInk
                SchoolScreen(
                    state = idleSchool.copy(lessons = listOf(openFirst.copy(state = locked))),
                    onIntent = { },
                    onReviewsOpen = { },
                    onLessonOpen = { },
                )
            }
        }

        assertEquals(warningInk, textStyleOf("Necesita la escuela en nivel 2").color)
    }

    @Test
    fun `opens the reviews from the pill with every lesson studied`() {
        show(idleSchool.copy(lessons = listOf(studiedFirst, studiedSecond)))

        composeRule.onNodeWithTag(INK_PILL).performClick()

        assertEquals(1, reviewOpens)
    }

    @Test
    fun `sets the school's name in display`() {
        show(idleSchool)

        assertEquals(40.sp, textStyleOf("Escuela").fontSize)
    }

    private fun showReadingBlockInks(state: SchoolUiState): Pair<Color, Color> {
        var inks: Pair<Color, Color> = Color.Unspecified to Color.Unspecified
        composeRule.setContent {
            MyGameTheme {
                inks = MyGameTheme.colors.onBlock to MyGameTheme.colors.onBlockMuted
                SchoolScreen(state = state, onIntent = { }, onReviewsOpen = { }, onLessonOpen = { })
            }
        }
        composeRule.waitForIdle()
        return inks
    }

    private fun textStyleOf(text: String): TextStyle {
        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(text, useUnmergedTree = true).fetchSemanticsNode()
            .config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)
        return results.first().layoutInput.style
    }

    private fun show(state: SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = { intent: SchoolIntent -> intents += intent },
                    onReviewsOpen = { reviewOpens += 1 },
                    onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
                )
            }
        }
    }
}
