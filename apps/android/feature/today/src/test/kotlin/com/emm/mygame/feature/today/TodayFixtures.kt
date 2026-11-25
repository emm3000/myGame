package com.emm.mygame.feature.today

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.testing.townOf
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

internal fun newTown(
    nextStep: NextStep,
    isFirstLessonStudied: Boolean = false,
    nextDueAt: Instant? = null,
    lessonSlot: TownSnapshot.LessonSlot? = null,
): TownSnapshot = townOf(
    readAt,
    nextStep = nextStep,
    lessons = listOf(lessonOf(LessonId("lesson-1"), isStudied = isFirstLessonStudied)),
    lessonSlot = lessonSlot,
    nextDueAt = nextDueAt,
)

private fun lessonOf(id: LessonId, isStudied: Boolean): TownSnapshot.Lesson = TownSnapshot.Lesson(
    id = id,
    theme = "A day in town",
    duration = 150.seconds,
    requiredSchoolLevel = 1,
    skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
    isStudied = isStudied,
    wordCount = 5,
    enteringWordCount = 5,
    readings = emptyList(),
    standings = emptyList(),
)
