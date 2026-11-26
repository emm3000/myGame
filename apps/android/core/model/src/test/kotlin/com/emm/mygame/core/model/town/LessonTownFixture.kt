package com.emm.mygame.core.model.town

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

abstract class LessonTownFixture {

    protected val readAt: Instant = Instant.parse("2026-11-13T10:00:00Z")

    protected val shelvedLesson: LessonId = LessonId("lesson-1")

    protected val releasedLesson: LessonId = LessonId("released-2-3")

    protected fun townOf(step: NextStep, running: LessonId? = null): TownSnapshot = TownSnapshot(
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
        away = null,
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
