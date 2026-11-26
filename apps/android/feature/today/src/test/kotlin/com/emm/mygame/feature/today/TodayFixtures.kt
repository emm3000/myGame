package com.emm.mygame.feature.today

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.testing.townOf
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal val readAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

internal fun newTown(
    nextStep: NextStep,
    isFirstLessonStudied: Boolean = false,
    nextDueAt: Instant? = null,
    lessonSlot: TownSnapshot.LessonSlot? = null,
    work: TownSnapshot.WorkItem? = null,
    job: TownSnapshot.Job? = null,
    buildings: List<TownSnapshot.Building>? = null,
    stocks: List<TownSnapshot.Stock> = emptyList(),
    away: TownSnapshot.Away? = null,
): TownSnapshot = townOf(
    readAt,
    nextStep = nextStep,
    lessons = listOf(lessonOf(LessonId("lesson-1"), isStudied = isFirstLessonStudied)),
    lessonSlot = lessonSlot,
    nextDueAt = nextDueAt,
).let { town: TownSnapshot ->
    town.copy(
        work = town.work.copy(slot = work),
        job = job,
        buildings = buildings ?: town.buildings,
        stocks = stocks,
        away = away,
    )
}

internal fun nextLevelOf(
    kind: TownBuildingKind,
    money: Long,
    people: Int = 1,
    wordsNeeded: TownSnapshot.WordsNeeded? = null,
): TownSnapshot.Building = TownSnapshot.Building(
    kind = kind,
    level = 1,
    next = TownSnapshot.NextLevel(
        level = 2,
        costs = listOf(TownSnapshot.Cost(TownResourceKind.Money, money)),
        duration = 3.minutes,
        people = people,
        wordsNeeded = wordsNeeded,
    ),
)

internal fun moneyHeld(amount: Long, ratePerHour: Double = 0.0): TownSnapshot.Stock = TownSnapshot.Stock(
    kind = TownResourceKind.Money,
    amount = amount,
    ratePerHour = ratePerHour,
    capacity = 1_000,
    fullAt = null,
)

internal fun farmWorkLasting(lasting: Duration): TownSnapshot.WorkItem = TownSnapshot.WorkItem(
    building = TownBuildingKind.Farm,
    level = 2,
    startsAt = readAt,
    finishesAt = readAt + lasting,
)

internal fun jobOnTheWayLasting(lasting: Duration): TownSnapshot.Job = TownSnapshot.Job(
    site = TownSite(region = 1, area = 1, site = 3),
    team = mapOf(TownHireKind.Worker to 3, TownHireKind.Truck to 1),
    task = TownSnapshot.JobTask.Hours(hours = 2),
    pay = mapOf(TownResourceKind.Money to 40L),
    phase = TownSnapshot.JobPhase.Outbound,
    sentAt = readAt,
    arrivesAt = readAt + lasting,
    leavesAt = readAt + lasting + 2.hours,
    returnsAt = readAt + lasting + 2.hours + lasting,
    calledBackAt = null,
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
