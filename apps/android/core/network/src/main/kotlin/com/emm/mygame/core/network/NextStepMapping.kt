package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.CaughtUpStep
import com.emm.mygame.core.network.generated.models.Goal
import com.emm.mygame.core.network.generated.models.LessonRunningStep
import com.emm.mygame.core.network.generated.models.NextStep as WireNextStep

internal fun WireNextStep.toNextStep(): NextStep? = when (this) {
    is WireNextStep.ReviewsWrapper -> NextStep.Reviews(value.count, value.readFirst.map(::LessonId))
    is WireNextStep.LessonrunningWrapper -> value.toLessonRunning()
    is WireNextStep.LessontostudyWrapper -> NextStep.LessonToStudy(LessonId(value.lessonId))
    is WireNextStep.CaughtupWrapper -> value.toCaughtUp()
}

private fun LessonRunningStep.toLessonRunning(): NextStep? {
    val named: LessonRunningStep.Producer = producer ?: return NextStep.LessonRunning(producer = null)
    val building: NextStep.Producer = named.toProducer() ?: return null
    return NextStep.LessonRunning(building)
}

private fun LessonRunningStep.Producer.toProducer(): NextStep.Producer? = when (this) {
    LessonRunningStep.Producer.farm -> NextStep.Producer.Farm
    LessonRunningStep.Producer.factory -> NextStep.Producer.Factory
    LessonRunningStep.Producer.powerStation -> NextStep.Producer.PowerStation
    LessonRunningStep.Producer.unknown_default_open_api -> null
}

private fun CaughtUpStep.toCaughtUp(): NextStep? {
    val named: Goal = goal ?: return NextStep.CaughtUp(goal = null)
    val next: TownGoal = named.toTownGoal() ?: return null
    return NextStep.CaughtUp(next)
}
