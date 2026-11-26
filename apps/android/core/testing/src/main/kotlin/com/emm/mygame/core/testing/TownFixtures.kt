package com.emm.mygame.core.testing

import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.school.RetainedWords
import kotlin.time.Instant

private val schoolOnly: List<TownSnapshot.Building> =
    listOf(TownSnapshot.Building(TownBuildingKind.School, level = 1, next = null))

private val schoolBesideAnUnbuiltOffice: List<TownSnapshot.Building> =
    schoolOnly + TownSnapshot.Building(TownBuildingKind.Office, level = 0, next = null)

val lessonsDone: NextStep.CaughtUp = NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null)

fun townOf(
    readAt: Instant,
    nextStep: NextStep = lessonsDone,
    hasOffice: Boolean = true,
    lessons: List<TownSnapshot.Lesson> = emptyList(),
    texts: List<TownSnapshot.TextTitle> = emptyList(),
    inLearning: Int = 0,
    retainedWords: RetainedWords? = null,
    lessonSlot: TownSnapshot.LessonSlot? = null,
    dueHoldoutChecks: List<TownSnapshot.DueHoldoutCheck> = emptyList(),
    nextDueAt: Instant? = null,
): TownSnapshot = TownSnapshot(
    name = "Riverton",
    label = TownLabel.Town,
    seasonInForce = null,
    seasonEndsAt = null,
    stocks = emptyList(),
    people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
    buildings = if (hasOffice) schoolBesideAnUnbuiltOffice else schoolOnly,
    work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
    lessons = lessons,
    releasedLessons = emptyList(),
    texts = texts,
    dueHoldoutChecks = dueHoldoutChecks,
    hasBandStarted = false,
    bandLines = emptyList(),
    skills = emptyList(),
    learning = TownSnapshot.Learning(
        cap = 10,
        inLearning = inLearning,
        retainedWords = retainedWords,
        nextInLearningDueAt = null,
    ),
    stableWordCount = 0,
    retainedWordCount = 0,
    lessonSlot = lessonSlot,
    hiring = hiringOf(),
    job = null,
    nextStep = nextStep,
    tip = null,
    nextDueAt = nextDueAt,
    away = null,
    readAt = readAt,
)
