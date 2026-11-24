package com.emm.mygame.core.model.town.guidance

import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.nameOf
import kotlin.time.Instant

data class NextStepCard(val line: Line, val detail: Detail?, val countdown: Countdown?, val action: Action) {

    sealed interface Line {

        data class ReviewsDue(val count: Int) : Line

        data class HoldoutCheck(val band: PlacementBand) : Line

        data object Studying : Line

        data class ReleasedLesson(val band: PlacementBand, val number: Int) : Line

        data class Lesson(val number: Int) : Line

        data object NoReviewsDue : Line

        data class LearningCap(val inLearning: Int, val cap: Int) : Line
    }

    sealed interface Detail {

        data class Words(val count: Int) : Detail
    }

    sealed interface Countdown {

        val at: Instant

        data class LessonReady(val name: LessonName, override val at: Instant) : Countdown

        data class NextReview(override val at: Instant) : Countdown
    }

    sealed interface Action {

        data class ReadWords(val lesson: LessonId?) : Action

        data object StartReviews : Action

        data class OpenHoldoutCheck(val band: PlacementBand, val week: HoldoutCheckWeek) : Action

        data class StudyReleased(val lesson: LessonId) : Action

        data class Study(val number: Int) : Action

        data object GoToReport : Action
    }
}

fun TownSnapshot.nextStepCard(): NextStepCard = when (val step: NextStep = nextStep) {
    is NextStep.Reviews -> NextStepCard(
        line = NextStepCard.Line.ReviewsDue(step.count),
        detail = null,
        countdown = lessonCountdown(),
        action = step.readFirst.firstOrNull()?.let { unread: LessonId -> NextStepCard.Action.ReadWords(unread) }
            ?: NextStepCard.Action.StartReviews,
    )
    is NextStep.HoldoutCheck -> NextStepCard(
        line = NextStepCard.Line.HoldoutCheck(step.band),
        detail = null,
        countdown = null,
        action = NextStepCard.Action.OpenHoldoutCheck(step.band, step.week),
    )
    is NextStep.LessonRunning -> NextStepCard(
        line = NextStepCard.Line.Studying,
        detail = null,
        countdown = lessonCountdown(),
        action = NextStepCard.Action.ReadWords(heldRunningLesson()),
    )
    is NextStep.ReleasedLesson -> NextStepCard(
        line = NextStepCard.Line.ReleasedLesson(step.band, step.position),
        detail = null,
        countdown = nextReviewCountdown(),
        action = NextStepCard.Action.StudyReleased(step.lesson),
    )
    is NextStep.LessonToStudy -> lessonToStudyCard(step.lesson)
    is NextStep.CaughtUp -> NextStepCard(
        line = caughtUpLineOf(step.reason),
        detail = null,
        countdown = nextReviewCountdown(),
        action = NextStepCard.Action.GoToReport,
    )
}

private fun TownSnapshot.caughtUpLineOf(reason: CaughtUpReason): NextStepCard.Line = when (reason) {
    CaughtUpReason.LearningCap -> NextStepCard.Line.LearningCap(inLearning = learning.inLearning, cap = learning.cap)
    CaughtUpReason.SchoolTooLow, CaughtUpReason.LessonsDone -> NextStepCard.Line.NoReviewsDue
}

private fun TownSnapshot.lessonToStudyCard(lesson: LessonId): NextStepCard {
    val number: Int = numberOf(lesson)
    return NextStepCard(
        line = NextStepCard.Line.Lesson(number),
        detail = NextStepCard.Detail.Words(wordCountOf(lesson)),
        countdown = nextReviewCountdown(),
        action = NextStepCard.Action.Study(number),
    )
}

private fun TownSnapshot.wordCountOf(lesson: LessonId): Int =
    lessons.firstOrNull { held: TownSnapshot.Lesson -> held.id == lesson }?.wordCount ?: 0

private fun TownSnapshot.heldRunningLesson(): LessonId? =
    lessonSlot?.lesson?.takeIf { running: LessonId -> isHeld(running) }

private fun TownSnapshot.isHeld(lesson: LessonId): Boolean =
    lessons.any { held: TownSnapshot.Lesson -> held.id == lesson } ||
        releasedLessons.any { held: TownSnapshot.ReleasedLesson -> held.id == lesson }

private fun TownSnapshot.lessonCountdown(): NextStepCard.Countdown? {
    val slot: TownSnapshot.LessonSlot = lessonSlot ?: return null
    if (!isHeld(slot.lesson)) return null
    return NextStepCard.Countdown.LessonReady(nameOf(slot.lesson), slot.finishesAt)
}

private fun TownSnapshot.nextReviewCountdown(): NextStepCard.Countdown? =
    nextDueAt?.let { dueAt: Instant -> NextStepCard.Countdown.NextReview(dueAt) }

fun TownSnapshot.numberOf(lesson: LessonId): Int =
    lessons.indexOfFirst { held: TownSnapshot.Lesson -> held.id == lesson } + 1
