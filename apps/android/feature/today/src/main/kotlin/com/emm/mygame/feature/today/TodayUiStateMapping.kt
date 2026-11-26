package com.emm.mygame.feature.today

import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.numberOf
import com.emm.mygame.core.model.town.jobs.nextInstant
import com.emm.mygame.core.model.town.nameOf
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.blockIn
import com.emm.mygame.core.projection.town.building.lineWith
import com.emm.mygame.core.projection.town.drawnAt
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.todayAt(
    now: Instant,
    gap: Duration,
    requests: TodayRequests,
    gained: List<TownSnapshot.Cost>,
    whatHappened: TodayUiState.WhatHappened?,
): TodayUiState.Content {
    val reaches: List<Reach> = reachesAt(now, gap)
    return TodayUiState.Content(
        eyebrow = if (hasStudiedALesson()) TodayUiState.Eyebrow.WhatIsNext else TodayUiState.Eyebrow.StartHere,
        first = firstCardAt(now, gap),
        gained = gained,
        whatHappened = whatHappened,
        lesson = runningLessonAt(now, gap),
        work = work.slot?.runningAt(now, gap),
        job = job?.outAt(now, gap),
        canDo = reaches.filter { reach: Reach -> reach.block == null }
            .map { reach: Reach -> TodayUiState.CanDo(reach.building, reach.next) },
        locked = reaches.mapNotNull { reach: Reach ->
            reach.block?.let { block: BlockReason -> TodayUiState.Locked(reach.building, reach.next, block) }
        },
        start = requests.lesson,
        build = requests.build,
    )
}

private data class Reach(val building: TownBuildingKind, val next: NextLevelLine, val block: BlockReason?)

private fun TownSnapshot.reachesAt(now: Instant, gap: Duration): List<Reach> {
    val drawn: Map<TownResourceKind, Long> = drawnAt(now)
    val goal: TownBuildingKind? = nextStep.goalBuilding()
    return buildings
        .mapNotNull { place: TownSnapshot.Building ->
            place.next?.lineWith(drawn)?.let { line: NextLevelLine ->
                Reach(place.kind, line, line.blockIn(this, drawn, now, gap))
            }
        }
        .sortedBy { reach: Reach -> reach.building != goal }
}

private fun NextStep.goalBuilding(): TownBuildingKind? = when (this) {
    is NextStep.LessonRunning -> goal?.building
    is NextStep.CaughtUp -> goal?.building
    is NextStep.Reviews, is NextStep.HoldoutCheck, is NextStep.ReleasedLesson, is NextStep.LessonToStudy -> null
}

private fun TownSnapshot.hasStudiedALesson(): Boolean =
    lessons.any(TownSnapshot.Lesson::isStudied) || releasedLessons.any(TownSnapshot.ReleasedLesson::isStudied)

private fun TownSnapshot.firstCardAt(now: Instant, gap: Duration): TodayUiState.FirstCard? =
    when (val step: NextStep = nextStep) {
        is NextStep.LessonToStudy -> TodayUiState.FirstCard.Study(step.lesson, numberOf(step.lesson))
        is NextStep.ReleasedLesson -> TodayUiState.FirstCard.StudyReleased(step.lesson, step.band, step.position)
        is NextStep.Reviews -> TodayUiState.FirstCard.Reviews(step.count, step.readFirst.firstOrNull())
        is NextStep.HoldoutCheck -> TodayUiState.FirstCard.HoldoutCheck(step.band, step.week)
        is NextStep.LessonRunning -> null
        is NextStep.CaughtUp -> TodayUiState.FirstCard.CaughtUp(
            line = caughtUpLineOf(step.reason),
            nextReview = nextDueAt?.let { dueAt: Instant -> timeAt(dueAt, now, gap) },
        )
    }

private fun TownSnapshot.caughtUpLineOf(reason: CaughtUpReason): TodayUiState.CaughtUpLine = when (reason) {
    CaughtUpReason.LearningCap -> TodayUiState.CaughtUpLine.LearningCap(learning.inLearning, learning.cap)
    CaughtUpReason.SchoolTooLow, CaughtUpReason.LessonsDone -> TodayUiState.CaughtUpLine.NoReviewsDue
}

private fun TownSnapshot.runningLessonAt(now: Instant, gap: Duration): TodayUiState.RunningLesson? {
    val slot: TownSnapshot.LessonSlot = lessonSlot ?: return null
    return TodayUiState.RunningLesson(
        lesson = slot.lesson,
        name = nameOf(slot.lesson),
        remaining = countdownTo(finishesAt = slot.finishesAt, now = now),
        finishesAt = slot.finishesAt - gap,
    )
}

private fun TownSnapshot.WorkItem.runningAt(now: Instant, gap: Duration): TodayUiState.RunningWork =
    TodayUiState.RunningWork(
        building = building,
        level = level,
        remaining = countdownTo(finishesAt = finishesAt, now = now),
        finishesAt = finishesAt - gap,
    )

private fun TownSnapshot.Job.outAt(now: Instant, gap: Duration): TodayUiState.JobOut {
    val next: Instant = nextInstant()
    return TodayUiState.JobOut(
        phase = phase,
        remaining = countdownTo(finishesAt = next, now = now),
        finishesAt = next - gap,
    )
}

internal fun TownSnapshot.countdownsAt(): List<Instant> =
    listOfNotNull(lessonSlot?.finishesAt, work.slot?.finishesAt, job?.nextInstant())

private fun timeAt(at: Instant, now: Instant, gap: Duration): TodayUiState.TimeAt =
    TodayUiState.TimeAt(remaining = countdownTo(finishesAt = at, now = now), at = at - gap)
