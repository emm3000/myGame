package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SchoolEnteringWordsTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val studied: TownSnapshot.Lesson = lessonOf(isStudied = true)

    private val fourWordsFree: TownSnapshot.Learning =
        TownSnapshot.Learning(cap = 10, inLearning = 6, retainedWords = null, nextInLearningDueAt = null)

    private val twoWordsFree: TownSnapshot.Learning =
        TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null, nextInLearningDueAt = null)

    private fun TestScope.schoolReading(town: TownSnapshot): SchoolViewModel = schoolReadingFrom(towns, town)

    @Test
    fun `leaves open a released lesson whose entering words fit under the cap though its whole count is past it`() =
        runTest {
            val heldOutRelease: TownSnapshot.ReleasedLesson =
                releasedLessonOf(LessonId("released-2-1"), position = 1, wordCount = 5, enteringWordCount = 4)
            val viewModel: SchoolViewModel = schoolReading(
                townOf(lessons = listOf(studied), releasedLessons = listOf(heldOutRelease), learning = fourWordsFree),
            )

            assertEquals(
                SchoolUiState.LessonState.Open(block = null),
                contentOf(viewModel).releasedLessons.single().state,
            )
        }

    @Test
    fun `counts only the entering words the next lesson would pass the cap with`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(studied, lessonOf(id = secondLesson, wordCount = 5, enteringWordCount = 3)),
                learning = twoWordsFree,
            ),
        )

        assertEquals(3, contentOf(viewModel).learning.pastCapWords)
    }

    @Test
    fun `counts no words past the cap while the next lesson's entering words fit`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(studied, lessonOf(id = secondLesson, wordCount = 5, enteringWordCount = 4)),
                learning = fourWordsFree,
            ),
        )

        assertEquals(null, contentOf(viewModel).learning.pastCapWords)
    }

    @Test
    fun `counts no words past the cap while the featured lesson's entering words fit`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(
                    lessonOf(wordCount = 5),
                    lessonOf(id = secondLesson, wordCount = 6, enteringWordCount = 4),
                ),
                learning = fourWordsFree,
            ),
        )

        viewModel.onIntent(SchoolIntent.LessonSelected(secondLesson))

        assertEquals(null, contentOf(viewModel).learning.pastCapWords)
    }

    @Test
    fun `counts the entering words the featured lesson would pass the cap with`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(
                    lessonOf(wordCount = 5),
                    lessonOf(id = secondLesson, wordCount = 6, enteringWordCount = 3),
                ),
                learning = twoWordsFree,
            ),
        )

        viewModel.onIntent(SchoolIntent.LessonSelected(secondLesson))

        assertEquals(3, contentOf(viewModel).learning.pastCapWords)
    }
}
