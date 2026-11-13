package com.emm.mygame.core.network

import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NextStepCardTest {

    private val readAt: Instant = Instant.parse("2026-11-13T10:00:00Z")

    private val shelvedLesson: LessonId = LessonId("lesson-1")

    private val releasedLesson: LessonId = LessonId("released-2-3")

    private val dueCheck: NextStep = NextStep.HoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth)

    private val releasedStep: NextStep = NextStep.ReleasedLesson(releasedLesson, PlacementBand.Second, position = 3)

    @Test
    fun `names the band of a due check`() {
        assertEquals(NextStepCard.Line.HoldoutCheck(PlacementBand.Second), townOf(dueCheck).nextStepCard().line)
    }

    @Test
    fun `opens the due check by its band and week`() {
        assertEquals(
            NextStepCard.Action.OpenHoldoutCheck(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth),
            townOf(dueCheck).nextStepCard().action,
        )
    }

    @Test
    fun `numbers a released lesson by its set in the band`() {
        assertEquals(
            NextStepCard.Line.ReleasedLesson(PlacementBand.Second, number = 3),
            townOf(releasedStep).nextStepCard().line,
        )
    }

    @Test
    fun `starts the released lesson the step names`() {
        assertEquals(NextStepCard.Action.StudyReleased(releasedLesson), townOf(releasedStep).nextStepCard().action)
    }

    @Test
    fun `shows the next review's time beside a released lesson`() {
        val town: TownSnapshot = townOf(releasedStep).copy(nextDueAt = readAt + 9.minutes)

        assertEquals(NextStepCard.Countdown.NextReview(readAt + 9.minutes), town.nextStepCard().countdown)
    }

    @Test
    fun `never numbers a released lesson`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(producer = null), running = releasedLesson)

        assertNull(running.nextStepCard().countdown)
    }

    @Test
    fun `opens the words of a running released lesson`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(producer = null), running = releasedLesson)

        assertEquals(NextStepCard.Action.ReadWords(releasedLesson), running.nextStepCard().action)
    }

    @Test
    fun `opens no words for a running lesson the town does not hold`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(producer = null), running = LessonId("gone"))

        assertEquals(NextStepCard.Action.ReadWords(lesson = null), running.nextStepCard().action)
    }

    @Test
    fun `opens the words of a running shelved lesson`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(producer = null), running = shelvedLesson)

        assertEquals(NextStepCard.Action.ReadWords(shelvedLesson), running.nextStepCard().action)
    }

    @Test
    fun `numbers a running shelved lesson by its place among the lessons`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(producer = null), running = shelvedLesson)

        assertEquals(
            NextStepCard.Countdown.LessonReady(number = 1, at = readAt + 5.minutes),
            running.nextStepCard().countdown,
        )
    }

    @Test
    fun `names a released lesson by its band and set`() {
        assertEquals(
            LessonName.Released(PlacementBand.Second, set = 3),
            townOf(NextStep.CaughtUp(goal = null)).nameOf(releasedLesson),
        )
    }

    @Test
    fun `names a shelved lesson by its place among the lessons`() {
        assertEquals(LessonName.Shelved(number = 1), townOf(NextStep.CaughtUp(goal = null)).nameOf(shelvedLesson))
    }

    private fun townOf(step: NextStep, running: LessonId? = null): TownSnapshot = TownSnapshot(
        name = "Maple",
        label = TownLabel.Town,
        seasonInForce = null,
        seasonEndsAt = null,
        stocks = emptyList(),
        people = TownSnapshot.People(supplied = 4, free = 4, atWork = 0),
        buildings = emptyList(),
        work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
        lessons = listOf(shelvedLessonOf()),
        releasedLessons = listOf(releasedLessonOf()),
        hasBandStarted = false,
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
        lessonSlot = running?.let { lesson: LessonId ->
            TownSnapshot.LessonSlot(lesson, startedAt = readAt, finishesAt = readAt + 5.minutes)
        },
        hiring = hiringOf(),
        job = null,
        nextStep = step,
        tip = null,
        nextDueAt = null,
        readAt = readAt,
    )

    private fun shelvedLessonOf(): TownSnapshot.Lesson = TownSnapshot.Lesson(
        id = shelvedLesson,
        theme = "Home",
        duration = 5.minutes,
        requiredSchoolLevel = 1,
        skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
        isStudied = false,
        wordCount = 5,
        readings = emptyList(),
        standings = emptyList(),
    )

    private fun releasedLessonOf(): TownSnapshot.ReleasedLesson = TownSnapshot.ReleasedLesson(
        id = releasedLesson,
        band = PlacementBand.Second,
        position = 3,
        duration = 5.minutes,
        requiredSchoolLevel = 1,
        isStudied = false,
        wordCount = 4,
        readings = emptyList(),
        standings = emptyList(),
    )
}
