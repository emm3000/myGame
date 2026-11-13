package com.emm.mygame.core.network

sealed interface NextStep {

    enum class Producer { Farm, Factory, PowerStation }

    data class Reviews(val count: Int, val readFirst: List<LessonId>) : NextStep

    data class HoldoutCheck(val band: PlacementBand, val week: HoldoutCheckWeek) : NextStep

    data class LessonRunning(val producer: Producer?) : NextStep

    data class ReleasedLesson(val lesson: LessonId, val band: PlacementBand, val position: Int) : NextStep

    data class LessonToStudy(val lesson: LessonId) : NextStep

    data class CaughtUp(val goal: TownGoal?) : NextStep
}
