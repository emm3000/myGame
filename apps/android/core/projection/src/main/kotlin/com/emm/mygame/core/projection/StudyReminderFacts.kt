package com.emm.mygame.core.projection

import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import kotlin.time.Instant
import kotlin.time.toJavaInstant
import kotlin.time.toKotlinInstant

data class StudyReminderFacts(
    val cardsWaitingFrom: Instant? = null,
    val lessonFinishingAt: Instant? = null,
    val isCheckDue: Boolean = false,
    val isLessonReady: Boolean = false,
) {

    fun afterTownAnswer(
        readAt: Instant,
        isOnReviewsStep: Boolean,
        nextDueAt: Instant?,
        lessonFinishesAt: Instant?,
        isCheckDue: Boolean,
        isLessonReady: Boolean,
    ): StudyReminderFacts = copy(
        cardsWaitingFrom = if (isOnReviewsStep) readAt else nextDueAt,
        lessonFinishingAt = lessonFinishesAt,
        isCheckDue = isCheckDue,
        isLessonReady = isLessonReady,
    )

    fun afterReviewsOrReportAnswer(readAt: Instant, hasDueCard: Boolean, nextDueAt: Instant?): StudyReminderFacts =
        copy(
            cardsWaitingFrom = if (hasDueCard) readAt else nextDueAt,
            lessonFinishingAt = lessonFinishingAt?.takeIf { finish: Instant -> readAt < finish },
        )

    fun afterHoldoutChecksAnswer(holdsCheck: Boolean): StudyReminderFacts = copy(isCheckDue = holdsCheck)
}

internal val StudyReminderFacts.wordsWaitingFrom: Instant?
    get() = listOfNotNull(cardsWaitingFrom, lessonFinishingAt).minOrNull()

fun studyReminderAt(facts: StudyReminderFacts, time: LocalTime, zone: ZoneId, now: Instant): Instant? {
    val earliest: Instant = earliestFactOf(facts, now) ?: return null
    val firstDay: LocalDate = maxOf(earliest, now).toJavaInstant().atZone(zone).toLocalDate()
    return generateSequence(firstDay) { day: LocalDate -> day.plusDays(1) }
        .map { day: LocalDate -> ZonedDateTime.of(day, time, zone).toInstant().toKotlinInstant() }
        .first { reminder: Instant -> reminder >= earliest && reminder > now }
}

private fun earliestFactOf(facts: StudyReminderFacts, now: Instant): Instant? {
    val nowWhileReady: Instant? = if (facts.isCheckDue || facts.isLessonReady) now else null
    return listOfNotNull(facts.wordsWaitingFrom, nowWhileReady).minOrNull()
}
