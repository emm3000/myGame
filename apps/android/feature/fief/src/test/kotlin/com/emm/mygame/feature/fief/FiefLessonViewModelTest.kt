package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonState
import com.emm.mygame.core.network.StudyRefusal
import com.emm.mygame.core.network.StudyResult
import com.emm.mygame.core.network.StudySlot
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeLearningRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefLessonViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val lessonOneId: LessonId = LessonId("lesson-1")

    @Test
    fun `draws lesson 1 idle with its theme and its count of words`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne())))

        viewModel.state.test {
            assertEquals(
                FiefUiState.LessonCard(
                    lesson = lessonOneId,
                    theme = "A day in town",
                    line = FiefUiState.LessonLine.Idle(wordCount = 5, isStudyRunning = false),
                ),
                awaitContent().library?.lesson,
            )
        }
    }

    @Test
    fun `keeps lesson 1 in reach while an art is under study`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingSmithing(targetLevel = 1, finishesIn = 30.minutes)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(), study = studying)))

        viewModel.state.test {
            assertEquals(
                FiefUiState.LessonLine.Idle(wordCount = 5, isStudyRunning = true),
                awaitContent().library?.lesson?.line,
            )
        }
    }

    @Test
    fun `counts lesson 1 down to its finish while it is under study`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingLessonOne(finishesIn = 150.seconds)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(), study = studying)))

        viewModel.state.test {
            assertEquals(FiefUiState.LessonLine.Busy(remaining = 150.seconds), awaitContent().library?.lesson?.line)
        }
    }

    @Test
    fun `draws no idle study slot while lesson 1 is under study`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingLessonOne(finishesIn = 150.seconds)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(), study = studying)))

        viewModel.state.test {
            assertEquals(FiefUiState.StudySlotLine.Lesson, awaitContent().library?.slot)
        }
    }

    @Test
    fun `blocks an art while lesson 1 is under study`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingLessonOne(finishesIn = 150.seconds)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(), study = studying)))

        viewModel.state.test {
            assertEquals(
                FiefUiState.StudyBlock.StudyRunning,
                awaitContent().library?.arts?.first()?.next?.block,
            )
        }
    }

    @Test
    fun `draws lesson 1 done once it is studied`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(isStudied = true))))

        viewModel.state.test {
            assertEquals(FiefUiState.LessonLine.Done, awaitContent().library?.lesson?.line)
        }
    }

    @Test
    fun `posts one lesson start while the first one waits`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: FiefViewModel = openFief(fiefs, learning = learning)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne())))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.LessonStudyTapped(lessonOneId))
            viewModel.onIntent(FiefIntent.LessonStudyTapped(lessonOneId))
            assertEquals(FiefUiState.StudyStatus.Waiting, awaitContent().library?.study)
        }
        assertEquals(
            listOf(FakeLearningRepository.LessonRequest.Start(FiefId(FIEF_ID), lessonOneId)),
            learning.lessons,
        )
    }

    @Test
    fun `restarts from the overview the lesson start answers`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: FiefViewModel = openFief(fiefs, learning = learning)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne())))
        val studying: StudySlot = studyingLessonOne(finishesIn = 150.seconds)
        learning.answerLesson(StudyResult.Answered(libraryWith(lessonOne(), study = studying)))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.LessonStudyTapped(lessonOneId))
            awaitContentWhere { it.library?.lesson?.line is FiefUiState.LessonLine.Busy }
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `cancels the study of the lesson it names`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: FiefViewModel = openFief(fiefs, learning = learning)
        val studying: StudySlot = studyingLessonOne(finishesIn = 150.seconds)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(), study = studying)))
        learning.answerLesson(StudyResult.Answered(libraryWith(lessonOne())))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.LessonCancelTapped(lessonOneId))
            awaitContentWhere { it.library?.lesson?.line is FiefUiState.LessonLine.Idle }
        }
        assertEquals(
            listOf(FakeLearningRepository.LessonRequest.Cancel(FiefId(FIEF_ID), lessonOneId)),
            learning.lessons,
        )
    }

    @Test
    fun `keeps the lesson refusal the api names beside the library`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: FiefViewModel = openFief(fiefs, learning = learning)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne())))
        learning.answerLesson(StudyResult.Refused(StudyRefusal.LessonUnderStudy))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.LessonStudyTapped(lessonOneId))
            assertEquals(
                FiefUiState.StudyStatus.Refused(StudyRefusal.LessonUnderStudy),
                awaitContentWhere { it.library?.study is FiefUiState.StudyStatus.Refused }.library?.study,
            )
        }
    }

    @Test
    fun `re-reads the fief when the cancel names a lesson no longer under study`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val learning: FakeLearningRepository = FakeLearningRepository()
        val viewModel: FiefViewModel = openFief(fiefs, learning = learning)
        val studying: StudySlot = studyingLessonOne(finishesIn = 150.seconds)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(), study = studying)))
        learning.answerLesson(StudyResult.Refused(StudyRefusal.LessonStudyNotFound))
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(isStudied = true))))

        viewModel.state.test {
            awaitContent()
            viewModel.onIntent(FiefIntent.LessonCancelTapped(lessonOneId))
            awaitContentWhere { it.library?.lesson?.line == FiefUiState.LessonLine.Done }
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `re-reads the fief when lesson 1 finishes`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val studying: StudySlot = studyingLessonOne(finishesIn = 2.seconds)
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(), study = studying)))
        fiefs.answerRead(FiefReadResult.Read(libraryWith(lessonOne(isStudied = true))))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(2.seconds)
            runCurrent()
            awaitContentWhere { it.library?.lesson?.line == FiefUiState.LessonLine.Done }
        }
        assertEquals(2, fiefs.readCount)
    }

    private fun libraryWith(
        lesson: LessonState,
        study: StudySlot = StudySlot.Idle,
    ): FiefSnapshot = fief(buildings = listOf(library(level = 1)), study = study, lessons = listOf(lesson))
}
