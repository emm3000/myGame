package com.emm.mygame.feature.school

import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.getUnclippedBoundsInRoot
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpRect
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

@RunWith(RobolectricTestRunner::class)
class SchoolLearningCapTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val intents: MutableList<SchoolIntent> = mutableListOf()

    private val readyLesson: SchoolUiState.LessonCard = SchoolUiState.LessonCard(
        lesson = firstLesson,
        number = 1,
        theme = "A day in town",
        wordCount = 5,
        enteringWordCount = 5,
        resource = TownResourceKind.Food,
        ratePercent = 5,
        duration = 150.seconds,
        path = SchoolPathCounts(held = 0, read = 0, reviewed = 0, learned = 0),
        state = SchoolUiState.LessonState.Open(block = null),
    )

    private val secondCard: SchoolUiState.LessonCard =
        readyLesson.copy(lesson = secondLesson, number = 2, theme = "Work and money")

    private val idleSchool: SchoolUiState.Content = SchoolUiState.Content(
        learning = SchoolUiState.LearningLine(
            inLearning = 0,
            cap = 10,
            pastCapWords = null,
            opening = SchoolUiState.CapOpening.ReviewsDue,
        ),
        slot = SchoolUiState.SlotLine.Idle,
        skills = emptyList(),
        lessons = listOf(readyLesson),
        releasedLessons = emptyList(),
        texts = emptyList(),
        studyMark = null,
        nextStep = caughtUpCard,
        start = SchoolUiState.LessonRequestStatus.Idle,
        stop = SchoolUiState.LessonRequestStatus.Idle,
        isHoldoutNoteShown = false,
        bandLines = emptyList(),
        reviews = null,
    )

    private val lessonOpens: MutableList<LessonId> = mutableListOf()

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

    private fun showing(line: String) {
        composeRule.onNodeWithText(line).performScrollTo().assertIsDisplayed()
    }

    private val fullLearning: TownSnapshot.Learning =
        TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null, nextInLearningDueAt = null)

    private val capRefusal: TownLessonRefusal = TownLessonRefusal.LearningCapReached(cap = 10, inLearning = 8)

    @Test
    fun `draws the words in learning and the cap`() {
        show(idleSchool.copy(learning = idleSchool.learning.copy(inLearning = 8)))

        showing("Palabras en aprendizaje: 8 de 10")
    }

    @Test
    fun `names one word past the cap in the singular`() {
        show(idleSchool.copy(learning = fullCap(words = 1, SchoolUiState.CapOpening.ReviewsDue)))

        showing("La siguiente lección trae 1 palabra. Empieza los repasos.")
    }

    @Test
    fun `names several words past the cap in the plural`() {
        show(idleSchool.copy(learning = fullCap(words = 5, SchoolUiState.CapOpening.ReviewsDue)))

        showing("La siguiente lección trae 5 palabras. Empieza los repasos.")
    }

    @Test
    fun `a full cap with reviews due sends to the reviews`() {
        showTown(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant + 3.hours),
                nextStep = NextStep.Reviews(count = 3, readFirst = emptyList()),
            ),
        )

        showing("La siguiente lección trae 5 palabras. Empieza los repasos.")
    }

    @Test
    fun `a full cap with no review due names when the next word in learning is due`() {
        showTown(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant + 3.hours),
                nextStep = NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null, text = null),
                nextDueAt = readInstant + 1.hours,
            ),
        )

        val line: String =
            "La siguiente lección trae 5 palabras. La siguiente palabra en aprendizaje se repasa en 3\u00A0h · "
        val lineTop: Dp = composeRule.onNodeWithText(line, substring = true)
            .performScrollTo()
            .assertIsDisplayed()
            .getUnclippedBoundsInRoot().top
        val learningBottom: Dp = composeRule.onNodeWithText("Palabras en aprendizaje: 8 de 10")
            .getUnclippedBoundsInRoot().bottom
        assertTrue(learningBottom <= lineTop)
        composeRule.onAllNodesWithText("Empieza los repasos.", substring = true).assertCountEquals(0)
    }

    @Test
    fun `draws the cap's line inside the learning card`() {
        show(idleSchool.copy(learning = fullCap(words = 5, SchoolUiState.CapOpening.ReviewsDue)))

        val line: DpRect = composeRule.onNodeWithText("La siguiente lección trae 5 palabras. Empieza los repasos.")
            .performScrollTo()
            .getUnclippedBoundsInRoot()
        val card: DpRect = composeRule.onNodeWithTag(LEARNING_CARD).getUnclippedBoundsInRoot()
        assertTrue("line $line, card $card", card.top <= line.top && line.bottom <= card.bottom)
    }

    @Test
    fun `a full cap whose next word in learning is overdue sends to the reviews`() {
        showTown(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant - 3.hours),
                nextStep = NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null, text = null),
            ),
        )

        showing("La siguiente lección trae 5 palabras. Empieza los repasos.")
    }

    @Test
    fun `names a next word in learning due within the hour by its minutes alone`() {
        val nextWord: SchoolUiState.CapOpening.NextWordDue =
            SchoolUiState.CapOpening.NextWordDue(remaining = 40.minutes, dueAt = readInstant + 40.minutes)
        show(idleSchool.copy(learning = fullCap(words = 5, nextWord)))

        showing("La siguiente lección trae 5 palabras. La siguiente palabra en aprendizaje se repasa en 40\u00A0min.")
    }

    private fun fullCap(words: Int, opening: SchoolUiState.CapOpening): SchoolUiState.LearningLine =
        SchoolUiState.LearningLine(inLearning = 8, cap = 10, pastCapWords = words, opening = opening)

    private fun showTown(
        town: TownSnapshot,
        start: SchoolUiState.LessonRequestStatus = SchoolUiState.LessonRequestStatus.Idle,
    ) {
        show(town.contentAt(readInstant, Duration.ZERO, SchoolRequests.none.copy(start = start), selected = null))
    }

    @Test
    fun `draws no line past the cap while the next lesson fits`() {
        show(idleSchool)

        composeRule.onAllNodesWithText("Empieza los repasos.", substring = true).assertCountEquals(0)
    }

    @Test
    fun `refuses past the cap with a review due by sending to the reviews`() {
        showTown(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant + 3.hours),
                nextStep = NextStep.Reviews(count = 3, readFirst = emptyList()),
            ),
            start = SchoolUiState.LessonRequestStatus.Refused(firstLesson, capRefusal),
        )

        showing("Palabras en aprendizaje: 8 de 10. Repásalas antes de empezar otra lección.")
    }

    @Test
    fun `refuses past the cap with no review due by naming when the next word in learning is due`() {
        showTown(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant + 3.hours),
                nextStep = NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null, text = null),
                nextDueAt = readInstant + 1.hours,
            ),
            start = SchoolUiState.LessonRequestStatus.Refused(firstLesson, capRefusal),
        )

        val refusal: String = "Palabras en aprendizaje: 8 de 10. La siguiente se repasa en 3\u00A0h · "
        composeRule.onNodeWithText(refusal, substring = true)
            .performScrollTo()
            .assertIsDisplayed()
        composeRule.onAllNodesWithText("Repásalas", substring = true).assertCountEquals(0)
    }

    @Test
    fun `states the cap's figure once, in the learning card, with 8 of 10 words`() {
        val capBlock = SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.CapReached(shortWords = 3))
        show(
            idleSchool.copy(
                learning = idleSchool.learning.copy(inLearning = 8),
                lessons = listOf(readyLesson.copy(state = capBlock), secondCard.copy(state = capBlock)),
            ),
        )

        composeRule.onAllNodesWithText("8 de 10", substring = true, useUnmergedTree = true).assertCountEquals(1)
        showing("Palabras en aprendizaje: 8 de 10")
    }
}
