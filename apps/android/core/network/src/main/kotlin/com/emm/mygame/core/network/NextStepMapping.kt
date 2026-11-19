package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.CaughtUpStep
import com.emm.mygame.core.network.generated.models.Goal
import com.emm.mygame.core.network.generated.models.HoldoutCheckStep
import com.emm.mygame.core.network.generated.models.LessonRunningStep
import com.emm.mygame.core.network.generated.models.ReleasedLessonStep
import com.emm.mygame.core.network.generated.models.NextStep as WireNextStep

internal fun WireNextStep.toNextStep(): NextStep? = when (this) {
    is WireNextStep.ReviewsWrapper -> NextStep.Reviews(value.count, value.readFirst.map(::LessonId))
    is WireNextStep.HoldoutcheckWrapper -> value.toHoldoutCheck()
    is WireNextStep.LessonrunningWrapper -> value.toLessonRunning()
    is WireNextStep.ReleasedlessonWrapper -> value.toReleasedLesson()
    is WireNextStep.LessontostudyWrapper -> NextStep.LessonToStudy(LessonId(value.lessonId))
    is WireNextStep.CaughtupWrapper -> value.toCaughtUp()
}

private fun HoldoutCheckStep.toHoldoutCheck(): NextStep? {
    val checked: PlacementBand = band.toBand() ?: return null
    val due: HoldoutCheckWeek = week.toWeek() ?: return null
    return NextStep.HoldoutCheck(checked, due)
}

private fun ReleasedLessonStep.toReleasedLesson(): NextStep? {
    val released: PlacementBand = band.toBand() ?: return null
    return NextStep.ReleasedLesson(LessonId(lessonId), released, position)
}

private fun LessonRunningStep.toLessonRunning(): NextStep? {
    val named: Goal = goal ?: return NextStep.LessonRunning(goal = null)
    val next: TownGoal = named.toTownGoal() ?: return null
    return NextStep.LessonRunning(next)
}

private fun CaughtUpStep.toCaughtUp(): NextStep? {
    val why: CaughtUpReason = reason.toCaughtUpReason() ?: return null
    val named: Goal = goal ?: return NextStep.CaughtUp(why, goal = null)
    val next: TownGoal = named.toTownGoal() ?: return null
    return NextStep.CaughtUp(why, next)
}

private fun CaughtUpStep.Reason.toCaughtUpReason(): CaughtUpReason? = when (this) {
    CaughtUpStep.Reason.learningCap -> CaughtUpReason.LearningCap
    CaughtUpStep.Reason.schoolTooLow -> CaughtUpReason.SchoolTooLow
    CaughtUpStep.Reason.lessonsDone -> CaughtUpReason.LessonsDone
    CaughtUpStep.Reason.unknown_default_open_api -> null
}
