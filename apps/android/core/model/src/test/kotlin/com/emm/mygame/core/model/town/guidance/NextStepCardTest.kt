package com.emm.mygame.core.model.town.guidance

import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.nameOf
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
    fun `shows a running released lesson's countdown by band and set`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(goal = null, text = null), running = releasedLesson)

        assertEquals(
            NextStepCard.Countdown.LessonReady(LessonName.Released(PlacementBand.Second, set = 3), readAt + 5.minutes),
            running.nextStepCard().countdown,
        )
    }

    @Test
    fun `shows no countdown for a running lesson the town does not hold`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(goal = null, text = null), running = LessonId("gone"))

        assertNull(running.nextStepCard().countdown)
    }

    @Test
    fun `opens the words of a running released lesson`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(goal = null, text = null), running = releasedLesson)

        assertEquals(NextStepCard.Action.ReadWords(releasedLesson), running.nextStepCard().action)
    }

    @Test
    fun `opens no words for a running lesson the town does not hold`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(goal = null, text = null), running = LessonId("gone"))

        assertEquals(NextStepCard.Action.ReadWords(lesson = null), running.nextStepCard().action)
    }

    @Test
    fun `opens the words of a running shelved lesson`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(goal = null, text = null), running = shelvedLesson)

        assertEquals(NextStepCard.Action.ReadWords(shelvedLesson), running.nextStepCard().action)
    }

    @Test
    fun `numbers a running shelved lesson by its place among the lessons`() {
        val running: TownSnapshot = townOf(NextStep.LessonRunning(goal = null, text = null), running = shelvedLesson)

        assertEquals(
            NextStepCard.Countdown.LessonReady(LessonName.Shelved(number = 1), at = readAt + 5.minutes),
            running.nextStepCard().countdown,
        )
    }

    @Test
    fun `a full learning cap names the cap and the next review`() {
        val fullCap: TownSnapshot = townOf(
            NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null, text = null),
        ).copy(
            learning = TownSnapshot.Learning(
                cap = 15,
                inLearning = 15,
                retainedWords = null,
                nextInLearningDueAt = null,
            ),
            nextDueAt = readAt + 40.minutes,
        )

        val card: NextStepCard = fullCap.nextStepCard()

        val capLine: NextStepCard.Line = NextStepCard.Line.LearningCap(inLearning = 15, cap = 15)
        assertEquals(capLine to NextStepCard.Countdown.NextReview(readAt + 40.minutes), card.line to card.countdown)
    }

    @Test
    fun `a school too low or no lessons left keeps no reviews due`() {
        val reasons: List<CaughtUpReason> = listOf(CaughtUpReason.SchoolTooLow, CaughtUpReason.LessonsDone)

        val lines: List<NextStepCard.Line> = reasons.map { reason: CaughtUpReason ->
            townOf(NextStep.CaughtUp(reason, goal = null, text = null)).nextStepCard().line
        }

        assertEquals(listOf(NextStepCard.Line.NoReviewsDue, NextStepCard.Line.NoReviewsDue), lines)
    }

    @Test
    fun `names a released lesson by its band and set`() {
        assertEquals(
            LessonName.Released(PlacementBand.Second, set = 3),
            townOf(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)).nameOf(releasedLesson),
        )
    }

    @Test
    fun `names a shelved lesson by its place among the lessons`() {
        val caughtUp: NextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)

        assertEquals(LessonName.Shelved(number = 1), townOf(caughtUp).nameOf(shelvedLesson))
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
        texts = emptyList(),
        dueHoldoutChecks = emptyList(),
        hasBandStarted = false,
        bandLines = emptyList(),
        skills = emptyList(),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null, nextInLearningDueAt = null),
        stableWordCount = 0,
        retainedWordCount = 0,
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
        enteringWordCount = 5,
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
        enteringWordCount = 4,
        readings = emptyList(),
        standings = emptyList(),
    )
}
