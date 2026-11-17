package com.emm.mygame.core.projection

import kotlin.time.Instant

enum class StudyReminderLine { Cards, Check, Lesson }

fun studyReminderLineAt(facts: StudyReminderFacts, firedAt: Instant): StudyReminderLine? = when {
    facts.wordsWaitingFrom?.let { waitingFrom: Instant -> waitingFrom <= firedAt } == true -> StudyReminderLine.Cards
    facts.isCheckDue -> StudyReminderLine.Check
    facts.isLessonReady -> StudyReminderLine.Lesson
    else -> null
}
