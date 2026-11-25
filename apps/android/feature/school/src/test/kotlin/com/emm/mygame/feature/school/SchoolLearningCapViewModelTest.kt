package com.emm.mygame.feature.school

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SchoolLearningCapViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val studied: TownSnapshot.Lesson = lessonOf(isStudied = true)

    private val fullLearning: TownSnapshot.Learning =
        TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null, nextInLearningDueAt = null)

    private val fullCapCaughtUp: NextStep.CaughtUp =
        NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null, text = null)

    private fun TestScope.schoolReading(town: TownSnapshot): SchoolViewModel = schoolReadingFrom(towns, town)

    private fun lessonOfCard(viewModel: SchoolViewModel, index: Int = 0): SchoolUiState.LessonCard =
        contentOf(viewModel).lessons[index]

    @Test
    fun `marks a lesson past the cap with the count in learning`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                learning = TownSnapshot.Learning(
                    cap = 10,
                    inLearning = 8,
                    retainedWords = null,
                    nextInLearningDueAt = null,
                ),
            ),
        )

        assertEquals(
            SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.CapReached),
            lessonOfCard(viewModel).state,
        )
    }

    @Test
    fun `leaves open a lesson that fills the cap exactly`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                learning = TownSnapshot.Learning(
                    cap = 10,
                    inLearning = 5,
                    retainedWords = null,
                    nextInLearningDueAt = null,
                ),
            ),
        )

        assertEquals(SchoolUiState.LessonState.Open(block = null), lessonOfCard(viewModel).state)
    }

    @Test
    fun `leaves open a lesson whose entering words fit under the cap though its whole count is past it`() =
        runTest {
            val viewModel: SchoolViewModel = schoolReading(
                townOf(
                    lessons = listOf(lessonOf(wordCount = 5, enteringWordCount = 4)),
                    learning = TownSnapshot.Learning(
                        cap = 10,
                        inLearning = 6,
                        retainedWords = null,
                        nextInLearningDueAt = null,
                    ),
                ),
            )

            assertEquals(SchoolUiState.LessonState.Open(block = null), lessonOfCard(viewModel).state)
        }

    @Test
    fun `counts the words the next lesson would pass the cap with`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(studied, lessonOf(id = secondLesson, wordCount = 3)),
                learning = TownSnapshot.Learning(
                    cap = 10,
                    inLearning = 8,
                    retainedWords = null,
                    nextInLearningDueAt = null,
                ),
            ),
        )

        assertEquals(3, contentOf(viewModel).learning.pastCapWords)
    }

    @Test
    fun `sends a full cap to the reviews while one is due`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant + 3.hours),
                nextStep = NextStep.Reviews(count = 3, readFirst = emptyList()),
                nextDueAt = readInstant,
            ),
        )

        assertEquals(SchoolUiState.CapOpening.ReviewsDue, contentOf(viewModel).learning.opening)
    }

    @Test
    fun `a full cap with no review due names when the next word in learning is due`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant + 3.hours),
                nextStep = fullCapCaughtUp,
                nextDueAt = readInstant + 1.hours,
            ),
        )

        assertEquals(
            SchoolUiState.CapOpening.NextWordDue(3.hours, dueAt = readInstant + 3.hours),
            contentOf(viewModel).learning.opening,
        )
    }

    @Test
    fun `names when the next word in learning is due on the device clock`() = runTest {
        val serverAhead: TownSnapshot = townOf(
            learning = fullLearning.copy(nextInLearningDueAt = readInstant + 5.minutes + 3.hours),
            nextStep = fullCapCaughtUp,
            readAt = readInstant + 5.minutes,
        )

        val viewModel: SchoolViewModel = schoolReading(serverAhead)

        assertEquals(
            SchoolUiState.CapOpening.NextWordDue(3.hours, dueAt = readInstant + 3.hours),
            contentOf(viewModel).learning.opening,
        )
    }

    @Test
    fun `sends a full cap to the reviews once the next word in learning is overdue`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant - 3.hours),
                nextStep = fullCapCaughtUp,
                nextDueAt = readInstant - 3.hours,
            ),
        )

        assertEquals(SchoolUiState.CapOpening.ReviewsDue, contentOf(viewModel).learning.opening)
    }

    @Test
    fun `sends a full cap to the reviews once the next word in learning comes due`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                learning = fullLearning.copy(nextInLearningDueAt = readInstant),
                nextStep = fullCapCaughtUp,
                nextDueAt = readInstant,
            ),
        )

        assertEquals(SchoolUiState.CapOpening.ReviewsDue, contentOf(viewModel).learning.opening)
    }

    @Test
    fun `counts no words past the cap while the next lesson fits`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                learning = TownSnapshot.Learning(
                    cap = 10,
                    inLearning = 5,
                    retainedWords = null,
                    nextInLearningDueAt = null,
                ),
            ),
        )

        assertEquals(null, contentOf(viewModel).learning.pastCapWords)
    }

    @Test
    fun `skips the running lesson when it looks for the next one`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(lessonOf(wordCount = 5), lessonOf(id = secondLesson, wordCount = 1)),
                learning = TownSnapshot.Learning(
                    cap = 10,
                    inLearning = 8,
                    retainedWords = null,
                    nextInLearningDueAt = null,
                ),
                lessonSlot = slotOf(),
            ),
        )

        assertEquals(null, contentOf(viewModel).learning.pastCapWords)
    }

    @Test
    fun `refuses a lesson past the cap and names the cap`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        val capRefusal: TownLessonRefusal = TownLessonRefusal.LearningCapReached(cap = 10, inLearning = 8)
        towns.answerLesson(TownLessonResult.Refused(capRefusal))

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequestStatus.Refused(firstLesson, capRefusal), contentOf(viewModel).start)
    }
}
