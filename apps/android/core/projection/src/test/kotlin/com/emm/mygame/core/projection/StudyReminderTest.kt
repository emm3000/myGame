package com.emm.mygame.core.projection

import java.time.LocalTime
import java.time.ZoneId
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class StudyReminderTest {

    private val sevenPm: LocalTime = LocalTime.of(19, 0)

    private val utcMinusFive: ZoneId = ZoneId.of("-05:00")

    private val readAfterReview: Instant = Instant.parse("2026-11-12T09:10:00Z")

    private val nextCardDueAt: Instant = Instant.parse("2026-11-23T09:10:00Z")

    private val morning: Instant = Instant.parse("2026-11-12T14:00:00Z")

    @Test
    fun `schedules no reminder when no fact is set`() {
        val reminder: Instant? = studyReminderAt(StudyReminderFacts(), sevenPm, utcMinusFive, now = readAfterReview)

        assertNull(reminder)
    }

    @Test
    fun `reminds at the first chosen time after the next due instant`() {
        val facts: StudyReminderFacts = townAnswerOf(readAt = readAfterReview, nextDueAt = nextCardDueAt)

        val reminder: Instant? = studyReminderAt(facts, sevenPm, utcMinusFive, now = readAfterReview)

        assertEquals(Instant.parse("2026-11-24T00:00:00Z"), reminder)
    }

    @Test
    fun `reminds this evening when a lesson is ready though the next card is due in 9 days`() {
        val facts: StudyReminderFacts = townAnswerOf(
            readAt = morning,
            nextDueAt = Instant.parse("2026-11-21T14:00:00Z"),
            isLessonReady = true,
        )

        val reminder: Instant? = studyReminderAt(facts, sevenPm, utcMinusFive, now = morning)

        assertEquals(Instant.parse("2026-11-13T00:00:00Z"), reminder)
    }

    @Test
    fun `reminds this evening when a check is due`() {
        val facts: StudyReminderFacts = townAnswerOf(
            readAt = morning,
            nextDueAt = Instant.parse("2026-11-21T14:00:00Z"),
            isCheckDue = true,
        )

        val reminder: Instant? = studyReminderAt(facts, sevenPm, utcMinusFive, now = morning)

        assertEquals(Instant.parse("2026-11-13T00:00:00Z"), reminder)
    }

    @Test
    fun `a town answer on the reviews step waits from its read instant`() {
        val facts: StudyReminderFacts = townAnswerOf(
            readAt = morning,
            isOnReviewsStep = true,
            nextDueAt = Instant.parse("2026-11-21T14:00:00Z"),
        )

        assertEquals(morning, facts.cardsWaitingFrom)
    }

    @Test
    fun `a reviews or Report read at or after the lesson's finish drops it`() {
        val lessonFinish: Instant = Instant.parse("2026-11-12T14:05:00Z")
        val runningLesson: StudyReminderFacts = townAnswerOf(readAt = morning, lessonFinishesAt = lessonFinish)

        val facts: StudyReminderFacts = runningLesson.afterReviewsOrReportAnswer(
            readAt = lessonFinish,
            hasDueCard = true,
            nextDueAt = null,
        )

        assertNull(facts.lessonFinishingAt)
    }

    @Test
    fun `reminds this evening when a lesson finishes with no card held`() {
        val facts: StudyReminderFacts = townAnswerOf(
            readAt = morning,
            lessonFinishesAt = Instant.parse("2026-11-12T14:05:00Z"),
        )

        val reminder: Instant? = studyReminderAt(facts, sevenPm, utcMinusFive, now = morning)

        assertEquals(Instant.parse("2026-11-13T00:00:00Z"), reminder)
    }

    @Test
    fun `a reviews or Report answer holding a due card waits from its read instant`() {
        val facts: StudyReminderFacts = StudyReminderFacts().afterReviewsOrReportAnswer(
            readAt = morning,
            hasDueCard = true,
            nextDueAt = Instant.parse("2026-11-21T14:00:00Z"),
        )

        assertEquals(morning, facts.cardsWaitingFrom)
    }

    @Test
    fun `a reviews or Report answer with nothing due waits from its next due instant`() {
        val twoDaysLater: Instant = Instant.parse("2026-11-14T14:00:00Z")

        val facts: StudyReminderFacts = StudyReminderFacts().afterReviewsOrReportAnswer(
            readAt = morning,
            hasDueCard = false,
            nextDueAt = twoDaysLater,
        )

        assertEquals(twoDaysLater, facts.cardsWaitingFrom)
    }

    @Test
    fun `the later of a town answer and a holdout checks answer decides check due`() {
        val checkTakenAfterTown: StudyReminderFacts = townAnswerOf(readAt = morning, isCheckDue = true)
            .afterHoldoutChecksAnswer(holdsCheck = false)
        val townAfterCheckShown: StudyReminderFacts = StudyReminderFacts()
            .afterHoldoutChecksAnswer(holdsCheck = true)
            .afterTownAnswer(
                readAt = morning,
                isOnReviewsStep = false,
                nextDueAt = null,
                lessonFinishesAt = null,
                isCheckDue = false,
                isLessonReady = false,
            )
        val checkShownAfterTown: StudyReminderFacts = townAnswerOf(readAt = morning)
            .afterHoldoutChecksAnswer(holdsCheck = true)

        val checksDue: List<Boolean> = listOf(checkTakenAfterTown, townAfterCheckShown, checkShownAfterTown)
            .map(StudyReminderFacts::isCheckDue)

        assertEquals(listOf(false, false, true), checksDue)
    }

    @Test
    fun `a reviews or Report read before the lesson's finish keeps it`() {
        val lessonFinish: Instant = Instant.parse("2026-11-12T14:05:00Z")
        val runningLesson: StudyReminderFacts = townAnswerOf(readAt = morning, lessonFinishesAt = lessonFinish)

        val facts: StudyReminderFacts = runningLesson.afterReviewsOrReportAnswer(
            readAt = Instant.parse("2026-11-12T14:04:00Z"),
            hasDueCard = false,
            nextDueAt = null,
        )

        assertEquals(lessonFinish, facts.lessonFinishingAt)
    }

    @Test
    fun `posts the cards line when the words wait from the firing instant`() {
        val firedAt: Instant = Instant.parse("2026-11-13T00:00:00Z")
        val facts: StudyReminderFacts = StudyReminderFacts(cardsWaitingFrom = firedAt, isLessonReady = true)

        assertEquals(StudyReminderLine.Cards, studyReminderLineAt(facts, firedAt))
    }

    @Test
    fun `posts the cards line before the check line before the lesson line`() {
        val firedAt: Instant = Instant.parse("2026-11-13T00:00:00Z")
        val lessonFinishedByFiring: StudyReminderFacts = StudyReminderFacts(
            lessonFinishingAt = Instant.parse("2026-11-12T14:05:00Z"),
            isCheckDue = true,
            isLessonReady = true,
        )
        val cardsDueAfterFiring: StudyReminderFacts = StudyReminderFacts(
            cardsWaitingFrom = Instant.parse("2026-11-13T00:01:00Z"),
            isCheckDue = true,
            isLessonReady = true,
        )
        val lessonReadyOnly: StudyReminderFacts = StudyReminderFacts(isLessonReady = true)

        val lines: List<StudyReminderLine?> = listOf(lessonFinishedByFiring, cardsDueAfterFiring, lessonReadyOnly)
            .map { facts: StudyReminderFacts -> studyReminderLineAt(facts, firedAt) }

        assertEquals(listOf(StudyReminderLine.Cards, StudyReminderLine.Check, StudyReminderLine.Lesson), lines)
    }

    @Test
    fun `after a firing the next reminder is the chosen time a day later`() {
        val facts: StudyReminderFacts = townAnswerOf(readAt = readAfterReview, nextDueAt = nextCardDueAt)
        val firedAt: Instant = Instant.parse("2026-11-24T00:00:00Z")

        val reminder: Instant? = studyReminderAt(facts, sevenPm, utcMinusFive, now = firedAt)

        assertEquals(Instant.parse("2026-11-25T00:00:00Z"), reminder)
    }

    @Test
    fun `keeps the chosen local time across the day the clocks go back`() {
        val newYork: ZoneId = ZoneId.of("America/New_York")
        val facts: StudyReminderFacts = townAnswerOf(
            readAt = Instant.parse("2026-10-20T12:00:00Z"),
            nextDueAt = Instant.parse("2026-10-30T12:00:00Z"),
        )
        val firedBeforeTheClocksGoBack: Instant = Instant.parse("2026-10-31T23:00:00Z")

        val reminder: Instant? = studyReminderAt(facts, sevenPm, newYork, now = firedBeforeTheClocksGoBack)

        assertEquals(Instant.parse("2026-11-02T00:00:00Z"), reminder)
    }

    @Test
    fun `a learning step due just after the chosen time waits for the next day's reminder`() {
        val readBeforeSevenPm: Instant = Instant.parse("2026-11-12T23:55:00Z")
        val facts: StudyReminderFacts = StudyReminderFacts().afterReviewsOrReportAnswer(
            readAt = readBeforeSevenPm,
            hasDueCard = false,
            nextDueAt = Instant.parse("2026-11-13T00:05:00Z"),
        )

        val reminder: Instant? = studyReminderAt(facts, sevenPm, utcMinusFive, now = readBeforeSevenPm)

        assertEquals(Instant.parse("2026-11-14T00:00:00Z"), reminder)
    }

    @Test
    fun `reminds after the lesson's finish when it comes before the next due card`() {
        val facts: StudyReminderFacts = townAnswerOf(
            readAt = morning,
            nextDueAt = Instant.parse("2026-11-21T14:00:00Z"),
            lessonFinishesAt = Instant.parse("2026-11-12T14:05:00Z"),
        )

        val reminder: Instant? = studyReminderAt(facts, sevenPm, utcMinusFive, now = morning)

        assertEquals(Instant.parse("2026-11-13T00:00:00Z"), reminder)
    }

    @Test
    fun `posts the cards line for a lesson finished before the next due card`() {
        val facts: StudyReminderFacts = townAnswerOf(
            readAt = morning,
            nextDueAt = Instant.parse("2026-11-21T14:00:00Z"),
            lessonFinishesAt = Instant.parse("2026-11-12T14:05:00Z"),
        )

        assertEquals(StudyReminderLine.Cards, studyReminderLineAt(facts, Instant.parse("2026-11-13T00:00:00Z")))
    }

    @Test
    fun `reminds two days later when the reviews are done and nothing waits`() {
        val twoDaysLater: Instant = Instant.parse("2026-11-14T14:00:00Z")
        val facts: StudyReminderFacts = StudyReminderFacts()
            .afterReviewsOrReportAnswer(readAt = morning, hasDueCard = false, nextDueAt = twoDaysLater)
            .afterTownAnswer(
                readAt = morning,
                isOnReviewsStep = false,
                nextDueAt = twoDaysLater,
                lessonFinishesAt = null,
                isCheckDue = false,
                isLessonReady = false,
            )

        val reminder: Instant? = studyReminderAt(facts, sevenPm, utcMinusFive, now = morning)

        assertEquals(Instant.parse("2026-11-15T00:00:00Z"), reminder)
    }

    @Test
    fun `posts the check line then the lesson line once the check is taken`() {
        val firedAt: Instant = Instant.parse("2026-11-13T00:00:00Z")
        val checkShown: StudyReminderFacts = townAnswerOf(readAt = morning, isCheckDue = true)
        val checkTaken: StudyReminderFacts = checkShown
            .afterHoldoutChecksAnswer(holdsCheck = false)
            .afterTownAnswer(
                readAt = firedAt,
                isOnReviewsStep = false,
                nextDueAt = null,
                lessonFinishesAt = null,
                isCheckDue = false,
                isLessonReady = true,
            )

        val lines: List<StudyReminderLine?> = listOf(checkShown, checkTaken)
            .map { facts: StudyReminderFacts -> studyReminderLineAt(facts, firedAt) }

        assertEquals(listOf(StudyReminderLine.Check, StudyReminderLine.Lesson), lines)
    }

    private fun townAnswerOf(
        readAt: Instant,
        isOnReviewsStep: Boolean = false,
        nextDueAt: Instant? = null,
        lessonFinishesAt: Instant? = null,
        isCheckDue: Boolean = false,
        isLessonReady: Boolean = false,
    ): StudyReminderFacts = StudyReminderFacts().afterTownAnswer(
        readAt = readAt,
        isOnReviewsStep = isOnReviewsStep,
        nextDueAt = nextDueAt,
        lessonFinishesAt = lessonFinishesAt,
        isCheckDue = isCheckDue,
        isLessonReady = isLessonReady,
    )
}
