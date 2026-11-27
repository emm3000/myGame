package com.emm.mygame.feature.school

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.GO_OUTLINED_PILL
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.WordStanding
import kotlin.time.Duration
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
class SchoolPathTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val dateWords: Regex = Regex(
        """(?<!\p{L})(hoy|ayer|mañana|d[ií]as?|semanas?|mes(es)?|racha|today|tomorrow|yesterday|days?|weeks?|""" +
            """months?|streak)(?!\p{L})|\d{1,2}[:/]\d{1,2}""",
        RegexOption.IGNORE_CASE,
    )

    private val studiedWith: (List<WordStanding>) -> TownSnapshot = { standings: List<WordStanding> ->
        townOf(lessons = listOf(lessonOf(isStudied = true, theme = "Greetings", standings = standings)))
    }

    private val secondLessonOpen: TownSnapshot.Lesson = lessonOf(id = secondLesson, theme = "Work and money")

    private fun pathOf(studied: Int, read: Int, reviewed: Int, learned: Int, total: Int): List<String> = listOf(
        "Estudiadas $studied de $total",
        "Puedes leer $read de $total",
        "Repasadas $reviewed de $total",
        "Aprendidas $learned de $total",
    )

    private fun shownPath(): List<String> =
        listOf("Estudiadas", "Puedes leer", "Repasadas", "Aprendidas").map { label: String ->
            val step: SemanticsNode = composeRule.onNodeWithText(label).fetchSemanticsNode()
            textsOf(step).joinToString(separator = " ")
        }

    private fun textsOf(node: SemanticsNode): List<String> =
        node.config.getOrNull(SemanticsProperties.Text).orEmpty().map(AnnotatedString::text)

    private fun rowText(): String {
        val inTheRow: SemanticsMatcher = hasAnyAncestor(hasTestTag(LESSON_ROW))
        return composeRule.onAllNodes(inTheRow, useUnmergedTree = true).fetchSemanticsNodes()
            .flatMap(::textsOf)
            .joinToString(separator = " ")
    }

    private fun topOf(text: String): Dp = composeRule.onNodeWithText(text).getUnclippedBoundsInRoot().top

    private fun show(town: TownSnapshot) {
        val state: SchoolUiState = town.contentAt(readInstant, Duration.ZERO, SchoolRequests.none, selected = null)
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = { },
                    onLessonOpen = {},
                    onTextOpen = {},
                    onReviewsOpen = {},
                )
            }
        }
    }

    @Test
    fun `counts the words past each standing`() {
        show(
            studiedWith(
                listOf(
                    WordStanding.Recognize,
                    WordStanding.Recall,
                    WordStanding.Hold,
                    WordStanding.Hold,
                    WordStanding.Retained,
                ),
            ),
        )

        assertEquals(pathOf(studied = 5, read = 4, reviewed = 3, learned = 1, total = 5), shownPath())
    }

    @Test
    fun `leaves a held-out word out of the count`() {
        show(
            studiedWith(
                listOf(
                    WordStanding.NotStarted,
                    WordStanding.Recall,
                    WordStanding.Hold,
                    WordStanding.Hold,
                    WordStanding.Retained,
                ),
            ),
        )

        assertEquals(pathOf(studied = 4, read = 4, reviewed = 3, learned = 1, total = 4), shownPath())
    }

    @Test
    fun `counts a lesson with every word at recognize as only studied`() {
        show(studiedWith(List(size = 5) { WordStanding.Recognize }))

        assertEquals(pathOf(studied = 5, read = 0, reviewed = 0, learned = 0, total = 5), shownPath())
    }

    @Test
    fun `shows a word moved back after a wrong recall`() {
        show(studiedWith(List(size = 4) { WordStanding.Hold } + WordStanding.Recall))

        assertEquals(pathOf(studied = 5, read = 5, reviewed = 4, learned = 0, total = 5), shownPath())
    }

    @Test
    fun `fills every count with every word retained`() {
        show(studiedWith(List(size = 5) { WordStanding.Retained }))

        assertEquals(pathOf(studied = 5, read = 5, reviewed = 5, learned = 5, total = 5), shownPath())
    }

    @Test
    fun `shows no path with no lesson studied`() {
        show(townOf(lessons = listOf(lessonOf(), secondLessonOpen)))

        composeRule.onAllNodesWithText("Estudiadas").assertCountEquals(0)
    }

    @Test
    fun `shows no date and no days away on the path`() {
        show(studiedWith(List(size = 5) { WordStanding.Hold }))

        val text: String = rowText()

        assertTrue(text, text.contains("Aprendidas"))
        assertFalse(text, dateWords.containsMatchIn(text))
    }

    @Test
    fun `draws no path on an unstudied lesson`() {
        val holdingWords: TownSnapshot.Lesson = lessonOf(
            id = secondLesson,
            theme = "Work and money",
            standings = List(size = 2) { WordStanding.Recognize } + List(size = 3) { WordStanding.NotStarted },
        )
        show(townOf(lessons = listOf(lessonOf(), holdingWords)))

        composeRule.onNodeWithText("Work and money").performScrollTo()
        composeRule.onAllNodesWithText("Estudiadas").assertCountEquals(0)
    }

    @Test
    fun `puts the next lesson first`() {
        show(townOf(lessons = listOf(lessonOf(isStudied = true), secondLessonOpen)))

        val blockTop: Dp = topOf("Lección 2")
        val pillTop: Dp = composeRule.onNodeWithTag(GO_OUTLINED_PILL).getUnclippedBoundsInRoot().top
        assertTrue(blockTop < pillTop)
        assertTrue(pillTop < topOf("Palabras en aprendizaje: 0 de 10"))
        assertTrue(topOf("Palabras en aprendizaje: 0 de 10") < topOf("Lección 1"))
    }

    @Test
    fun `sets the reward as words to skill to rate`() {
        show(townOf(lessons = listOf(lessonOf(wordCount = 5))))

        composeRule.onNodeWithText("5 palabras · Habilidad: comida +5\u00A0%").performScrollTo()
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    fun `fits the reward on one line on a narrow phone`() {
        val widest: TownSnapshot.Lesson = lessonOf(
            wordCount = 10,
            ratePercent = 10,
            resource = TownResourceKind.Material,
        )
        show(townOf(lessons = listOf(widest)))

        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText("10 palabras · Habilidad: material +10\u00A0%", useUnmergedTree = true)
            .fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)

        assertEquals(1, results.first().lineCount)
    }

    @Test
    fun `shows no link to the reviews when none is due`() {
        val pastTheCap: TownSnapshot.Learning = TownSnapshot.Learning(
            cap = 10,
            inLearning = 8,
            retainedWords = null,
            nextInLearningDueAt = null,
        )
        show(townOf(lessons = listOf(lessonOf(isStudied = true), secondLessonOpen), learning = pastTheCap))

        composeRule.onAllNodesWithText("Empezar los repasos").assertCountEquals(0)
        composeRule.onAllNodesWithText("Leer las palabras", substring = true).assertCountEquals(0)
    }

    @Test
    fun `shows no second way to the words while a lesson runs with no review due`() {
        show(
            townOf(
                lessons = listOf(lessonOf(), secondLessonOpen),
                lessonSlot = slotOf(),
                nextStep = NextStep.LessonRunning(goal = null, text = null),
            ),
        )

        composeRule.onAllNodesWithText("Leer las palabras", substring = true).assertCountEquals(1)
    }
}
