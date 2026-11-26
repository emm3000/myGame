package com.emm.mygame.feature.today

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.numberOf
import com.emm.mygame.core.model.town.jobs.nextInstant
import com.emm.mygame.core.model.town.nameOf
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.todayAt(now: Instant, gap: Duration, start: TodayUiState.StartStatus): TodayUiState.Content =
    TodayUiState.Content(
        eyebrow = if (hasStudiedALesson()) TodayUiState.Eyebrow.WhatIsNext else TodayUiState.Eyebrow.StartHere,
        first = firstCardAt(now, gap),
        lesson = runningLessonAt(now, gap),
        work = work.slot?.runningAt(now, gap),
        job = job?.outAt(now, gap),
        start = start,
    )

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
