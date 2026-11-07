package com.emm.mygame.feature.school

import app.cash.turbine.test
import com.emm.mygame.core.network.TownLessonRefusal
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SchoolViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val studied: TownSnapshot.Lesson = lessonOf(isStudied = true)

    private fun TestScope.schoolReading(town: TownSnapshot): SchoolViewModel = schoolReadingFrom(towns, town)

    private fun lessonOfCard(viewModel: SchoolViewModel, index: Int = 0): SchoolUiState.LessonCard =
        contentOf(viewModel).lessons[index]

    @Test
    fun `draws loading until the town answers`() = runTest {
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)
        runCurrent()

        assertEquals(SchoolUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `draws the failed read with its retry`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)
        runCurrent()

        assertEquals(SchoolUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads again on a retry`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)
        runCurrent()
        towns.answerRead(TownReadResult.Read(townOf()))

        viewModel.onIntent(SchoolIntent.RetryTapped)
        runCurrent()

        assertEquals(1, contentOf(viewModel).schoolLevel)
    }

    @Test
    fun `reads once on a double retry tap`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)
        runCurrent()

        viewModel.onIntent(SchoolIntent.RetryTapped)
        viewModel.onIntent(SchoolIntent.RetryTapped)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `leaves the school when the player holds no town`() = runTest {
        towns.answerRead(TownReadResult.NoTown)
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)

        viewModel.effects.test {
            assertEquals(SchoolEffect.NoTown, awaitItem())
        }
    }

    @Test
    fun `draws the level of the school`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(schoolLevel = 3))

        assertEquals(3, contentOf(viewModel).schoolLevel)
    }

    @Test
    fun `offers lesson 1 ready to start`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())

        assertEquals(
            SchoolUiState.LessonCard(
                lesson = firstLesson,
                number = 1,
                theme = "A day in town",
                wordCount = 5,
                resource = TownResourceKind.Food,
                ratePercent = 5,
                duration = 150.seconds,
                state = SchoolUiState.LessonState.Open(block = null),
            ),
            lessonOfCard(viewModel),
        )
    }

    @Test
    fun `starts lesson 1 from the school`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        towns.answerLesson(TownLessonResult.Answered(townOf(lessonSlot = slotOf())))

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(listOf(firstLesson), towns.lessonStarts)
    }

    @Test
    fun `draws the lesson the api answers as running`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        towns.answerLesson(TownLessonResult.Answered(townOf(lessonSlot = slotOf())))

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonState.Studying, lessonOfCard(viewModel).state)
    }

    @Test
    fun `waits for the answer of a start`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Waiting, contentOf(viewModel).start)
    }

    @Test
    fun `starts a lesson once on a double tap`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(1, towns.lessonStarts.size)
    }

    @Test
    fun `marks a lesson the school is too low for`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessons = listOf(lessonOf(requiredSchoolLevel = 2))))

        assertEquals(
            SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2)),
            lessonOfCard(viewModel).state,
        )
    }

    @Test
    fun `leaves open a lesson the school reaches exactly`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(lessons = listOf(lessonOf(requiredSchoolLevel = 2)), schoolLevel = 2),
        )

        assertEquals(SchoolUiState.LessonState.Open(block = null), lessonOfCard(viewModel).state)
    }

    @Test
    fun `sends a blocked lesson anyway, since the api is the verdict`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessons = listOf(lessonOf(requiredSchoolLevel = 2))))

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(listOf(firstLesson), towns.lessonStarts)
    }

    @Test
    fun `marks a lesson past the cap with the count in learning`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(learning = TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null)),
        )

        assertEquals(
            SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.CapReached(8, cap = 10, wordCount = 5)),
            lessonOfCard(viewModel).state,
        )
    }

    @Test
    fun `leaves open a lesson that fills the cap exactly`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(learning = TownSnapshot.Learning(cap = 10, inLearning = 5, retainedWords = null)),
        )

        assertEquals(SchoolUiState.LessonState.Open(block = null), lessonOfCard(viewModel).state)
    }

    @Test
    fun `names the school before the cap as the block of a lesson`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(lessonOf(requiredSchoolLevel = 2)),
                learning = TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null),
            ),
        )

        assertEquals(
            SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SchoolTooLow(requiredLevel = 2)),
            lessonOfCard(viewModel).state,
        )
    }

    @Test
    fun `names the running lesson as the block of the next one`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(lessonOf(), lessonOf(id = secondLesson, requiredSchoolLevel = 2)),
                lessonSlot = slotOf(),
            ),
        )

        assertEquals(
            SchoolUiState.LessonState.Open(SchoolUiState.LessonBlock.SlotBusy(number = 1)),
            lessonOfCard(viewModel, index = 1).state,
        )
    }

    @Test
    fun `counts the words the next lesson would pass the cap with`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(studied, lessonOf(id = secondLesson, wordCount = 3)),
                learning = TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null),
            ),
        )

        assertEquals(SchoolUiState.LearningLine(8, cap = 10, wordsPastCap = 3), contentOf(viewModel).learning)
    }

    @Test
    fun `counts no words past the cap while the next lesson fits`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(learning = TownSnapshot.Learning(cap = 10, inLearning = 5, retainedWords = null)),
        )

        assertEquals(SchoolUiState.LearningLine(5, cap = 10, wordsPastCap = null), contentOf(viewModel).learning)
    }

    @Test
    fun `skips the running lesson when it looks for the next one`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(lessonOf(wordCount = 5), lessonOf(id = secondLesson, wordCount = 1)),
                learning = TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null),
                lessonSlot = slotOf(),
            ),
        )

        assertEquals(null, contentOf(viewModel).learning.wordsPastCap)
    }

    @Test
    fun `refuses a lesson past the cap and names the cap`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        val capRefusal: TownLessonRefusal = TownLessonRefusal.LearningCapReached(cap = 10, inLearning = 8)
        towns.answerLesson(TownLessonResult.Refused(capRefusal))

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Refused(firstLesson, capRefusal), contentOf(viewModel).start)
    }

    @Test
    fun `keeps an outage beside the lesson that asked`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        towns.answerLesson(TownLessonResult.Unreachable)

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(SchoolUiState.LessonRequest.Unreachable(firstLesson), contentOf(viewModel).start)
    }

    @Test
    fun `asks again after a refused start`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())
        towns.answerLesson(TownLessonResult.Refused(TownLessonRefusal.LessonUnderStudy))
        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        viewModel.onIntent(SchoolIntent.StudyTapped(firstLesson))
        runCurrent()

        assertEquals(2, towns.lessonStarts.size)
    }

    @Test
    fun `marks a studied lesson`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessons = listOf(studied)))

        assertEquals(SchoolUiState.LessonState.Studied, lessonOfCard(viewModel).state)
    }

    @Test
    fun `numbers each lesson by its place in the list`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessons = listOf(studied, lessonOf(id = secondLesson))))

        assertEquals(2, lessonOfCard(viewModel, index = 1).number)
    }

    @Test
    fun `shows a running lesson's countdown`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(lessonSlot = slotOf(startedAt = readInstant - 108.seconds)),
        )

        assertEquals(
            SchoolUiState.SlotLine.Busy(firstLesson, number = 1, remaining = 42.seconds, total = 150.seconds),
            contentOf(viewModel).slot,
        )
    }

    @Test
    fun `counts the lesson down between reads`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(lessonSlot = slotOf(startedAt = readInstant - 108.seconds)),
        )

        advanceTimeBy(10.seconds)
        runCurrent()

        assertEquals(32.seconds, (contentOf(viewModel).slot as SchoolUiState.SlotLine.Busy).remaining)
    }

    @Test
    fun `projects the countdown from the server's instant on a skewed device`() = runTest {
        towns.answerRead(TownReadResult.Read(townOf(lessonSlot = slotOf())))
        val viewModel: SchoolViewModel = schoolViewModelOf(towns, start = readInstant + 2.minutes)
        runCurrent()

        assertEquals(150.seconds, (contentOf(viewModel).slot as SchoolUiState.SlotLine.Busy).remaining)
    }

    @Test
    fun `draws an idle slot without a lesson running`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf())

        assertEquals(SchoolUiState.SlotLine.Idle, contentOf(viewModel).slot)
    }

    @Test
    fun `draws the finished lesson while the read at its finish waits`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))

        advanceTimeBy(10.seconds)
        runCurrent()

        assertEquals(SchoolUiState.SlotLine.Done(firstLesson, number = 1), contentOf(viewModel).slot)
    }

    @Test
    fun `reads the town once at the lesson's finish`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))
        towns.answerRead(
            TownReadResult.Read(townOf(lessons = listOf(studied), readAt = readInstant + 10.seconds)),
        )

        advanceTimeBy(10.seconds)
        runCurrent()

        assertEquals(SchoolUiState.LessonState.Studied, lessonOfCard(viewModel).state)
    }

    @Test
    fun `reads nothing while the lesson runs`() = runTest {
        schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))

        advanceTimeBy(9.seconds)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `reads the town when the building work finishes, since the school may rise`() = runTest {
        schoolReading(townOf(workSlot = workOf(readInstant + 5.minutes)))

        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads the town when the season ends, since it changes a lesson's duration`() = runTest {
        schoolReading(townOf(seasonEndsAt = readInstant + 90.seconds))

        advanceTimeBy(90.seconds)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `ignores a finish already past in the answer of a read`() = runTest {
        schoolReading(townOf(seasonEndsAt = readInstant - 1.minutes))

        advanceTimeBy(5.minutes)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `retries a failed read at a finish after a fixed minute`() = runTest {
        schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))
        towns.answerRead(TownReadResult.Unreachable)
        advanceTimeBy(10.seconds)
        runCurrent()

        advanceTimeBy(59.seconds)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads again a minute after a failed read`() = runTest {
        schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))
        towns.answerRead(TownReadResult.Unreachable)
        advanceTimeBy(10.seconds)
        runCurrent()
        towns.answerRead(TownReadResult.Unreachable)

        advanceTimeBy(60.seconds)
        runCurrent()

        assertEquals(3, towns.readCount)
    }

    @Test
    fun `keeps the fixed minute while another countdown repaints each second`() = runTest {
        schoolReading(
            townOf(seasonEndsAt = readInstant + 10.seconds, lessonSlot = slotOf(lasting = 30.seconds)),
        )
        towns.answerRead(TownReadResult.Unreachable)
        advanceTimeBy(10.seconds)
        runCurrent()

        advanceTimeBy(59.seconds)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `keeps counting down while a failed read waits for its minute`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(seasonEndsAt = readInstant + 10.seconds, lessonSlot = slotOf(lasting = 30.seconds)),
        )
        towns.answerRead(TownReadResult.Unreachable)
        advanceTimeBy(10.seconds)
        runCurrent()

        advanceTimeBy(5.seconds)
        runCurrent()

        assertEquals(15.seconds, (contentOf(viewModel).slot as SchoolUiState.SlotLine.Busy).remaining)
    }

    @Test
    fun `leaves the school when a read at a finish finds no town`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(townOf(lessonSlot = slotOf(lasting = 10.seconds)))
        towns.answerRead(TownReadResult.NoTown)

        viewModel.effects.test {
            advanceTimeBy(10.seconds)
            runCurrent()
            assertEquals(SchoolEffect.NoTown, awaitItem())
        }
    }

    @Test
    fun `lists each earned skill with its resource and percent`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                skills = listOf(
                    TownSnapshot.EarnedSkill(firstLesson, TownResourceKind.Food, ratePercent = 5),
                    TownSnapshot.EarnedSkill(secondLesson, TownResourceKind.Power, ratePercent = 7),
                ),
            ),
        )

        assertEquals(
            listOf(
                SchoolUiState.SkillLine(firstLesson, TownResourceKind.Food, level = 1, ratePercent = 5),
                SchoolUiState.SkillLine(secondLesson, TownResourceKind.Power, level = 1, ratePercent = 7),
            ),
            contentOf(viewModel).skills,
        )
    }

    @Test
    fun `raises the level of a second skill on one resource`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                skills = listOf(
                    TownSnapshot.EarnedSkill(firstLesson, TownResourceKind.Food, ratePercent = 5),
                    TownSnapshot.EarnedSkill(secondLesson, TownResourceKind.Food, ratePercent = 5),
                ),
            ),
        )

        assertEquals(listOf(1, 2), contentOf(viewModel).skills.map(SchoolUiState.SkillLine::level))
    }

    @Test
    fun `selects the lesson the player tapped`() = runTest {
        val viewModel: SchoolViewModel =
            schoolReading(townOf(lessons = listOf(lessonOf(), lessonOf(id = secondLesson))))

        viewModel.onIntent(SchoolIntent.LessonSelected(secondLesson))

        assertEquals(secondLesson, contentOf(viewModel).shown?.lesson)
    }

    @Test
    fun `keeps the selected lesson through the next read`() = runTest {
        val lessons: List<TownSnapshot.Lesson> = listOf(lessonOf(), lessonOf(id = secondLesson))
        val viewModel: SchoolViewModel =
            schoolReading(townOf(lessons = lessons, seasonEndsAt = readInstant + 10.seconds))
        viewModel.onIntent(SchoolIntent.LessonSelected(secondLesson))
        towns.answerRead(TownReadResult.Read(townOf(lessons = lessons, readAt = readInstant + 10.seconds)))

        advanceTimeBy(11.seconds)
        runCurrent()

        assertEquals(secondLesson, contentOf(viewModel).shown?.lesson)
    }

    @Test
    fun `falls back to the next open lesson once the selected one is studied`() = runTest {
        val viewModel: SchoolViewModel = schoolReading(
            townOf(
                lessons = listOf(lessonOf(), lessonOf(id = secondLesson)),
                seasonEndsAt = readInstant + 10.seconds,
            ),
        )
        viewModel.onIntent(SchoolIntent.LessonSelected(secondLesson))
        towns.answerRead(
            TownReadResult.Read(
                townOf(
                    lessons = listOf(lessonOf(), lessonOf(id = secondLesson, isStudied = true)),
                    readAt = readInstant + 10.seconds,
                ),
            ),
        )

        advanceTimeBy(11.seconds)
        runCurrent()

        assertEquals(firstLesson, contentOf(viewModel).shown?.lesson)
    }
}
