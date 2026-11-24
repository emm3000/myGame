package com.emm.mygame.core.network.town.guidance

import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.NextStepText
import com.emm.mygame.core.model.town.school.WordStanding
import com.emm.mygame.core.network.town.TownRepositoryFixture
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownNextStepRepositoryTest : TownRepositoryFixture() {

    @Test
    fun `reads a caught up next step with no review ahead`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null), read.nextStep)
        assertEquals(null, read.nextDueAt)
    }

    @Test
    fun `reads the reviews step with its count and the lessons to read first`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"reviews","count":3,"readFirst":["lesson-2","lesson-3"]}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.Reviews(3, listOf(LessonId("lesson-2"), LessonId("lesson-3"))), read.nextStep)
    }

    @Test
    fun `reads the lesson to study`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"lessonToStudy","lessonId":"lesson-2"}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.LessonToStudy(LessonId("lesson-2")), read.nextStep)
    }

    @Test
    fun `reads the due check step with its band and week`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"holdoutCheck","band":2,"week":24}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth), read.nextStep)
    }

    @Test
    fun `reads the released lesson step with its band and set`() = runTest {
        val step: String = """{"kind":"releasedLesson","lessonId":"released-1-2","band":1,"position":2}"""
        api.enqueue(json(200, townWithNextStep(step)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            NextStep.ReleasedLesson(LessonId("released-1-2"), PlacementBand.First, position = 2),
            read.nextStep,
        )
    }

    @Test
    fun `reads why no lesson can start on a caught up step`() = runTest {
        val wireReasons: Map<String, CaughtUpReason> = mapOf(
            "learningCap" to CaughtUpReason.LearningCap,
            "schoolTooLow" to CaughtUpReason.SchoolTooLow,
            "lessonsDone" to CaughtUpReason.LessonsDone,
        )
        val repository: TownRepository = town()

        val reasons: List<NextStep> = wireReasons.keys.map { reason: String ->
            val step = """{"kind":"caughtUp","reason":"$reason","goal":null,"text":null}"""
            api.enqueue(json(200, townWithNextStep(step)))
            (repository.read() as TownReadResult.Read).town.nextStep
        }

        val expected: List<NextStep> = wireReasons.values.map { reason: CaughtUpReason ->
            NextStep.CaughtUp(reason, goal = null, text = null)
        }
        assertEquals(expected, reasons)
    }

    @Test
    fun `reads the newest text on a caught up step`() = runTest {
        val step: String =
            """{"kind":"caughtUp","reason":"lessonsDone","goal":null,"text":{"id":"text-31","title":"The New Shop"}}"""
        api.enqueue(json(200, townWithNextStep(step)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            NextStep.CaughtUp(
                CaughtUpReason.LessonsDone,
                goal = null,
                text = NextStepText(TextId("text-31"), "The New Shop"),
            ),
            read.nextStep,
        )
    }

    @Test
    fun `reads the newest text on a running lesson`() = runTest {
        val step: String = """{"kind":"lessonRunning","goal":null,"text":{"id":"text-31","title":"The New Shop"}}"""
        api.enqueue(json(200, townWithNextStep(step)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            NextStep.LessonRunning(goal = null, text = NextStepText(TextId("text-31"), "The New Shop")),
            read.nextStep,
        )
    }

    @Test
    fun `reads no text on a running lesson before one opens`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"lessonRunning","goal":null,"text":null}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.LessonRunning(goal = null, text = null), read.nextStep)
    }

    @Test
    fun `answers unreachable for a caught up step on a reason the client does not know`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"caughtUp","reason":"slotBusy","goal":null,"text":null}""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `answers unreachable for a check step on a week the client does not know`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"holdoutCheck","band":1,"week":52}""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `reads the released lessons apart from the lessons`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""releasedLessons":[]""", """"releasedLessons":[$RELEASED]""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(
                TownSnapshot.ReleasedLesson(
                    id = LessonId("released-2-1"),
                    band = PlacementBand.Second,
                    position = 1,
                    duration = 5.minutes,
                    requiredSchoolLevel = 1,
                    isStudied = false,
                    wordCount = 1,
                    enteringWordCount = 1,
                    readings = emptyList(),
                    standings = listOf(WordStanding.NotStarted),
                ),
            ),
            read.releasedLessons,
        )
    }

    @Test
    fun `reads the words of a released lesson`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""releasedLessons":[]""", """"releasedLessons":[$READ_RELEASED]""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(
                TownSnapshot.WordReading(
                    word = "ticket",
                    frame = listOf(
                        FrameSpan(text = "I buy a ", support = null),
                        FrameSpan(text = "ticket", support = null),
                        FrameSpan(text = ".", support = null),
                    ),
                    support = null,
                ),
            ),
            read.releasedLessons.single().readings,
        )
    }

    @Test
    fun `reads the standing of each word of a released lesson`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""releasedLessons":[]""", """"releasedLessons":[$READ_RELEASED]""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(listOf(WordStanding.Recall), read.releasedLessons.single().standings)
    }

    @Test
    fun `never adds a released lesson to the lessons`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""releasedLessons":[]""", """"releasedLessons":[$RELEASED]""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(emptyList<TownSnapshot.Lesson>(), read.lessons)
    }

    @Test
    fun `answers unreachable for a released lesson on a band the client does not know`() = runTest {
        val unknownBand: String = RELEASED.replace(""""band":2""", """"band":7""")
        api.enqueue(json(200, TOWN.replace(""""releasedLessons":[]""", """"releasedLessons":[$unknownBand]""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `reads when the next word in learning is due`() = runTest {
        val noneInLearning: String = """"inLearning":0,"retainedWords":null,"nextInLearningDueAt":null"""
        val eightInLearning: String =
            """"inLearning":8,"retainedWords":null,"nextInLearningDueAt":"2026-11-14T09:30:00.000Z""""
        api.enqueue(json(200, TOWN.replace(noneInLearning, eightInLearning)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(Instant.parse("2026-11-14T09:30:00Z"), read.learning.nextInLearningDueAt)
    }

    @Test
    fun `reads no instant when no word is in learning`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(null, read.learning.nextInLearningDueAt)
    }

    private companion object {
        const val RELEASED: String =
            """{"id":"released-2-1","band":2,"position":1,"durationSeconds":300,"requiredSchoolLevel":1,""" +
                """"isStudied":false,"words":[{"wordId":"word-1","standing":"notStarted","reading":null,""" +
                """"support":null}],"enteringWordCount":1}"""
        const val READ_RELEASED: String =
            """{"id":"released-2-1","band":2,"position":1,"durationSeconds":300,"requiredSchoolLevel":1,""" +
                """"isStudied":true,"words":[{"wordId":"word-1","standing":"recall","reading":""" +
                """{"word":"ticket","frame":[{"text":"I buy a ","support":null},""" +
                """{"text":"ticket","support":null},{"text":".","support":null}]},"support":null}],""" +
                """"enteringWordCount":1}"""
    }
}
