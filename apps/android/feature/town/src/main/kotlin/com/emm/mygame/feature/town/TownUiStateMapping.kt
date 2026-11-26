package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.blockIn
import com.emm.mygame.core.projection.town.building.lineWith
import com.emm.mygame.core.projection.town.projected
import com.emm.mygame.feature.town.building.FillTime
import com.emm.mygame.feature.town.building.PeopleLine
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.StockLine
import com.emm.mygame.feature.town.building.WordsLine
import com.emm.mygame.feature.town.building.work.SlotLine
import com.emm.mygame.feature.town.building.work.WaitingLine
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import com.emm.mygame.feature.town.hiring.hiringLineAt
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Instant

private val fillHourWindow: Duration = 8.hours

internal fun TownSnapshot.contentAt(
    now: Instant,
    gap: Duration,
    requests: TownRequests,
    registered: TownRegistered,
    hiringEntries: Map<TownHireKind, String>,
    closed: ClosedGuidance,
): TownUiState.Content {
    val lines: List<StockLine> = stocks
        .sortedBy { stock: TownSnapshot.Stock -> stock.kind.ordinal }
        .map { stock: TownSnapshot.Stock -> stock.lineAt(readAt, now, gap, skillLevelOf(stock.kind)) }
    val drawn: Map<TownResourceKind, Long> = lines.associate { line: StockLine -> line.kind to line.amount }
    val goal: TownGoal? = nextStep.carriedGoal()?.takeUnless { closed.isGoalClosed }
    return TownUiState.Content(
        name = name,
        label = label,
        stocks = lines,
        people = PeopleLine(free = people.free, atWork = people.atWork),
        words = WordsLine(stable = stableWordCount, retained = retainedWordCount),
        season = seasonLineAt(now),
        buildMark = seasonInForce?.buildMark(),
        slot = work.slot?.slotLineAt(now, gap) ?: SlotLine.Idle,
        waitingList = work.waitingList.map { item: TownSnapshot.WorkItem -> item.waitingLineAt(now, gap) },
        places = buildings
            .sortedBy { place: TownSnapshot.Building -> placeOrder.indexOf(place.kind) }
            .map { place: TownSnapshot.Building -> place.cardWith(drawn, this, registered, now, gap) },
        nextStepPlace = nextStep.placeWith(goal),
        goal = goal,
        tip = tip?.takeUnless { shown: TipKind -> shown in closed.tips },
        start = requests.start,
        stop = requests.stop,
        hiring = hiringLineAt(now = now, gap = gap, drawn = drawn, entries = hiringEntries, requests = requests),
    )
}

internal fun TownSnapshot.isDueAt(now: Instant): Boolean =
    changesOnTheirOwn().any { instant: Instant -> instant > readAt && instant <= now }

internal fun TownSnapshot.nearestCountdownAt(now: Instant): Duration? =
    (changesOnTheirOwn() + work.waitingList.map { item: TownSnapshot.WorkItem -> item.finishesAt })
        .filter { instant: Instant -> instant > now }
        .minOrNull()
        ?.let { instant: Instant -> instant - now }

private fun NextStep.carriedGoal(): TownGoal? = when (this) {
    is NextStep.LessonRunning -> goal
    is NextStep.CaughtUp -> goal
    is NextStep.Reviews, is NextStep.HoldoutCheck, is NextStep.ReleasedLesson, is NextStep.LessonToStudy -> null
}

private fun NextStep.placeWith(goal: TownGoal?): TownBuildingKind = when (this) {
    is NextStep.CaughtUp -> goal?.building ?: TownBuildingKind.School
    is NextStep.LessonRunning, is NextStep.Reviews, is NextStep.HoldoutCheck, is NextStep.ReleasedLesson,
    is NextStep.LessonToStudy,
    -> TownBuildingKind.School
}

private fun TownSnapshot.changesOnTheirOwn(): List<Instant> =
    listOfNotNull(work.slot?.finishesAt, lessonSlot?.finishesAt, hiring.order?.endsAt, seasonEndsAt, nextDueAt)

private fun TownSnapshot.Stock.lineAt(
    readAt: Instant,
    now: Instant,
    gap: Duration,
    skillLevel: Int,
): StockLine {
    val amount: Long = projected().amountAt(readAt = readAt, now = now)
    return StockLine(
        kind = kind,
        amount = amount,
        capacity = capacity,
        ratePerHour = ratePerHour.toLong(),
        skillLevel = skillLevel,
        fill = if (amount < capacity) fillTimeAt(readAt, now, gap) else null,
    )
}

private fun TownSnapshot.Stock.fillTimeAt(readAt: Instant, now: Instant, gap: Duration): FillTime? {
    val fillsAt: Instant = fullAt ?: return null
    if (fillsAt - readAt > fillHourWindow) return null
    return FillTime(remaining = countdownTo(finishesAt = fillsAt, now = now), fullAt = fillsAt - gap)
}

private fun TownSnapshot.skillLevelOf(kind: TownResourceKind): Int =
    skills.count { skill: TownSnapshot.EarnedSkill -> skill.resource == kind }

private fun TownSnapshot.WorkItem.slotLineAt(now: Instant, gap: Duration): SlotLine {
    val remaining: Duration = countdownTo(finishesAt = finishesAt, now = now)
    if (remaining == Duration.ZERO) return SlotLine.Done(building, level)
    return SlotLine.Busy(
        building = building,
        level = level,
        remaining = remaining,
        total = finishesAt - startsAt,
        finishesAt = finishesAt - gap,
    )
}

private fun TownSnapshot.WorkItem.waitingLineAt(now: Instant, gap: Duration): WaitingLine =
    WaitingLine(
        building = building,
        level = level,
        remaining = countdownTo(finishesAt = finishesAt, now = now),
        finishesAt = finishesAt - gap,
    )

private fun TownSnapshot.Building.cardWith(
    drawn: Map<TownResourceKind, Long>,
    town: TownSnapshot,
    registered: TownRegistered,
    now: Instant,
    gap: Duration,
): PlaceCard {
    val line: NextLevelLine? = next?.lineWith(drawn)
    return PlaceCard(
        kind = kind,
        level = level,
        raisedFrom = registered.raisedPlaces
            .firstOrNull { raised: TownRegistered.RaisedPlace -> raised.kind == kind }
            ?.levelBefore,
        isInWork = town.isWorkingOn(kind),
        next = line,
        block = line?.blockIn(town, drawn, now, gap),
    )
}

private fun TownSnapshot.isWorkingOn(kind: TownBuildingKind): Boolean =
    (listOfNotNull(work.slot) + work.waitingList).any { item: TownSnapshot.WorkItem -> item.building == kind }
