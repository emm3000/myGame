package com.emm.mygame.feature.school

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasAnySibling
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithContentDescription
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.seconds
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
class SchoolReleasedLessonsTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val secondSet: LessonId = LessonId("released-2-2")

    private val firstSet: LessonId = LessonId("released-2-1")

    private val secondSetTitle: String = "Palabras que vuelven: banda 2, grupo\u00A02"

    private val firstSetTitle: String = "Palabras que vuelven: banda 2, grupo\u00A01"

    private val fiveWords: Regex = Regex("""\b5\s+palabras?\b""")

    private val inSizeLabel: SemanticsMatcher =
        hasTestTag(LESSON_SIZE_LABEL) or hasAnyAncestor(hasTestTag(LESSON_SIZE_LABEL))

    private val capShortOfFiveWords: TownSnapshot.Learning =
        TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null, nextInLearningDueAt = null)

    private val intents: MutableList<SchoolIntent> = mutableListOf()

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

    private val shelvedAndReleased: TownSnapshot = townOf(
        lessons = listOf(lessonOf(), lessonOf(id = secondLesson, theme = "Work and money")),
        releasedLessons = listOf(releasedLessonOf(secondSet, position = 2), releasedLessonOf(firstSet, position = 1)),
    )

    private val releasedUnderStudy: TownSnapshot = shelvedAndReleased.copy(
        lessonSlot = slotOf(lesson = secondSet),
        nextStep = NextStep.LessonRunning(goal = null, text = null),
    )

    private val releasedStudied: TownSnapshot = shelvedAndReleased.copy(
        releasedLessons = listOf(releasedLessonOf(secondSet, position = 2, isStudied = true)),
    )

    @Test
    fun `draws released lessons after the shelved lessons`() {
        show(contentOf(shelvedAndReleased))

        val shelved: Dp = topOf("Lección 2")
        val released: Dp = topOf(secondSetTitle)

        assertTrue(shelved < released)
    }

    @Test
    fun `draws released lessons in the api's order`() {
        show(contentOf(shelvedAndReleased))

        assertTrue(topOf(secondSetTitle) < topOf(firstSetTitle))
    }

    @Test
    fun `labels a released lesson by band and set, never by number`() {
        show(contentOf(shelvedAndReleased))

        composeRule.onNodeWithText(firstSetTitle).assertExists()
        composeRule.onAllNodesWithText("Lección 0", substring = true).assertCountEquals(0)
        composeRule.onAllNodesWithText("Lección 3", substring = true).assertCountEquals(0)
    }

    @Test
    fun `starts a released lesson`() {
        show(contentOf(shelvedAndReleased))

        composeRule
            .onNodeWithContentDescription("$secondSetTitle · Estudiar", substring = true)
            .performScrollTo()
            .performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(secondSet)), intents)
    }

    @Test
    fun `draws the api's refusal under the released lesson it answers`() {
        val refused: SchoolUiState.LessonRequestStatus = SchoolUiState.LessonRequestStatus.Refused(
            secondSet,
            TownLessonRefusal.StudySlotBusy,
        )
        show(contentOf(shelvedAndReleased).copy(start = refused))

        val refusal: Dp = topOf("La escuela ya tiene un estudio en marcha. Espera a que termine.")

        assertTrue(topOf(secondSetTitle) < refusal)
        assertTrue(refusal < topOf(firstSetTitle))
    }

    @Test
    fun `draws when the cap opens under a released lesson refused past the cap`() {
        val pastTheCap: SchoolUiState.LessonRequestStatus = SchoolUiState.LessonRequestStatus.Refused(
            secondSet,
            TownLessonRefusal.LearningCapReached(cap = 10, inLearning = 10),
        )
        val nextWordDue: SchoolUiState.CapOpening =
            SchoolUiState.CapOpening.NextWordDue(remaining = 3.hours, dueAt = readInstant + 3.hours)
        val content: SchoolUiState.Content = contentOf(shelvedAndReleased)
        show(content.copy(start = pastTheCap, learning = content.learning.copy(opening = nextWordDue)))

        val opening: Dp = composeRule
            .onNodeWithText("Palabras en aprendizaje: 10 de 10. La siguiente se repasa en 3\u00A0h", substring = true)
            .performScrollTo()
            .getUnclippedBoundsInRoot().top

        assertTrue(topOf(secondSetTitle) < opening)
        assertTrue(opening < topOf(firstSetTitle))
    }

    @Test
    fun `states the next lesson's word count once with the cap short of it and a released lesson blocked`() {
        val onlyTheNextLessonHoldsFive: TownSnapshot = shelvedAndReleased.copy(
            learning = capShortOfFiveWords,
            lessons = listOf(lessonOf(), lessonOf(id = secondLesson, theme = "Work and money", wordCount = 4)),
            releasedLessons = listOf(
                releasedLessonOf(secondSet, position = 2, wordCount = 4),
                releasedLessonOf(firstSet, position = 1, wordCount = 4),
            ),
        )
        show(contentOf(onlyTheNextLessonHoldsFive))

        assertEquals(listOf("5 palabras · Habilidad: comida +5 %"), fiveWordStatementsOf(inSizeLabel))
        assertEquals(
            listOf("La siguiente lección trae 5 palabras. Empieza los repasos."),
            fiveWordStatementsOf(!inSizeLabel),
        )
    }

    @Test
    fun `states the next lesson's word count once when another lesson holds as many words`() {
        val twoLessonsHoldFive: TownSnapshot = shelvedAndReleased.copy(
            learning = capShortOfFiveWords,
            lessons = listOf(lessonOf(), lessonOf(id = secondLesson, theme = "Work and money", wordCount = 5)),
            releasedLessons = listOf(
                releasedLessonOf(secondSet, position = 2, wordCount = 5),
                releasedLessonOf(firstSet, position = 1, wordCount = 4),
            ),
        )
        show(contentOf(twoLessonsHoldFive))

        assertEquals(
            listOf("La siguiente lección trae 5 palabras. Empieza los repasos."),
            fiveWordStatementsOf(!inSizeLabel),
        )
    }

    @Test
    fun `states the next lesson's word count once beside a studied lesson of as many words`() {
        val studiedLessonHoldsFive: TownSnapshot = townOf(
            learning = capShortOfFiveWords,
            lessons = listOf(lessonOf(isStudied = true), lessonOf(id = secondLesson, theme = "Work and money")),
        )
        show(contentOf(studiedLessonHoldsFive))

        assertEquals(
            listOf("La siguiente lección trae 5 palabras. Empieza los repasos."),
            fiveWordStatementsOf(!inSizeLabel),
        )
    }

    @Test
    fun `marks a released lesson under study as studying`() {
        val card: SchoolUiState.ReleasedLessonCard = contentOf(releasedUnderStudy).releasedLessons.first()

        assertEquals(SchoolUiState.LessonState.Studying, card.state)
    }

    @Test
    fun `marks a studied released lesson as studied`() {
        val card: SchoolUiState.ReleasedLessonCard = contentOf(releasedStudied).releasedLessons.first()

        assertEquals(SchoolUiState.LessonState.Studied, card.state)
    }

    @Test
    fun `opens the words of a released lesson under study`() {
        show(contentOf(releasedUnderStudy))

        composeRule.onNodeWithText("$secondSetTitle · Leer las palabras")
            .performScrollTo()
            .performClick()

        assertEquals(listOf(secondSet), lessonOpens)
    }

    @Test
    fun `offers no start on a studied released lesson`() {
        show(contentOf(releasedStudied))

        composeRule
            .onAllNodesWithContentDescription("Estudiar las palabras que vuelven", substring = true)
            .assertCountEquals(0)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `keeps a studied released lesson's status on one line`() {
        show(contentOf(releasedStudied))

        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText("Estudiada", useUnmergedTree = true)
            .fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)

        assertEquals(1, results.first().lineCount)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 2.0f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `a released lesson's row at font scale 2 wraps its status before it squeezes its title`() {
        show(contentOf(releasedUnderStudy))

        val results: MutableList<TextLayoutResult> = mutableListOf()
        val rowStatus: SemanticsMatcher = hasText("En estudio") and hasAnySibling(hasTestTag(LESSON_SIZE_LABEL))
        composeRule.onNode(rowStatus, useUnmergedTree = true)
            .fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)

        assertEquals("the status's lines", 2, results.first().lineCount)
    }

    @Test
    @Config(qualifiers = "+w360dp-h640dp", fontScale = 1.1f)
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    fun `keeps a released lesson's set number beside its set word`() {
        show(contentOf(shelvedAndReleased))

        val results: MutableList<TextLayoutResult> = mutableListOf()
        composeRule.onNodeWithText(secondSetTitle, useUnmergedTree = true)
            .fetchSemanticsNode().config[SemanticsActions.GetTextLayoutResult].action?.invoke(results)

        val layout: TextLayoutResult = results.first()
        assertTrue(layout.lineCount > 1)
        assertEquals(
            layout.getLineForOffset(secondSetTitle.indexOf("grupo")),
            layout.getLineForOffset(secondSetTitle.length - 1),
        )
    }

    @Test
    fun `keeps the first shelved lesson in the list while a released lesson is the next step`() {
        show(contentOf(shelvedAndReleased.copy(nextStep = NextStep.ReleasedLesson(secondSet, PlacementBand.Second, 2))))

        composeRule.onNodeWithText("Lección 1").assertExists()
    }

    @Test
    fun `starts the next step's released lesson from its own row`() {
        show(contentOf(shelvedAndReleased.copy(nextStep = NextStep.ReleasedLesson(secondSet, PlacementBand.Second, 2))))

        composeRule
            .onNodeWithContentDescription("$secondSetTitle · Estudiar", substring = true)
            .performScrollTo()
            .performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StudyTapped(secondSet)), intents)
    }

    @Test
    fun `keeps the released lesson's row while a chosen lesson takes the next step's place`() {
        val releasedNext: TownSnapshot =
            shelvedAndReleased.copy(nextStep = NextStep.ReleasedLesson(secondSet, PlacementBand.Second, 2))
        show(contentOf(releasedNext).copy(selected = firstLesson))

        composeRule.onAllNodesWithText(secondSetTitle, useUnmergedTree = true).assertCountEquals(1)
    }

    @Test
    fun `keeps the first shelved lesson in the list while a holdout check is the next step`() {
        val dueCheck: NextStep = NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)
        show(contentOf(shelvedAndReleased.copy(nextStep = dueCheck)))

        composeRule.onNodeWithText("Lección 1").assertExists()
    }

    @Test
    fun `stops a released lesson under study`() {
        show(contentOf(releasedUnderStudy))

        composeRule
            .onNodeWithContentDescription("Parar el estudio de las palabras que vuelven de la banda 2, grupo 2")
            .performScrollTo()
            .performClick()

        assertEquals(listOf<SchoolIntent>(SchoolIntent.StopTapped(secondSet)), intents)
    }

    private fun contentOf(town: TownSnapshot): SchoolUiState.Content = town.contentAt(
        now = readInstant + 30.seconds,
        gap = Duration.ZERO,
        requests = SchoolRequests.none,
        selected = null,
    )

    private fun linesOf(node: SemanticsNode): List<String> =
        node.config.getOrNull(SemanticsProperties.Text).orEmpty().map { line: AnnotatedString -> line.text } +
            node.config.getOrNull(SemanticsProperties.ContentDescription).orEmpty() +
            listOfNotNull(node.config.getOrNull(SemanticsProperties.StateDescription))

    private fun fiveWordStatementsOf(nodes: SemanticsMatcher): List<String> = composeRule
        .onAllNodes(nodes, useUnmergedTree = true)
        .fetchSemanticsNodes()
        .flatMap(::linesOf)
        .filter { line: String -> fiveWords.containsMatchIn(line) }

    private fun topOf(text: String): Dp = composeRule.onNodeWithText(text).getUnclippedBoundsInRoot().top

    private fun show(state: SchoolUiState) {
        composeRule.setContent {
            MyGameTheme {
                SchoolScreen(
                    state = state,
                    onIntent = { intent: SchoolIntent -> intents += intent },
                    onLessonOpen = { lesson: LessonId -> lessonOpens += lesson },
                    onTextOpen = {},
                    onReviewsOpen = {},
                )
            }
        }
    }
}
