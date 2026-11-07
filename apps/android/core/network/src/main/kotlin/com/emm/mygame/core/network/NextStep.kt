package com.emm.mygame.core.network

sealed interface NextStep {

    enum class Producer { Farm, Factory, PowerStation }

    data class Reviews(val count: Int, val readFirst: List<LessonId>) : NextStep

    data class LessonRunning(val producer: Producer?) : NextStep

    data class LessonToStudy(val lesson: LessonId) : NextStep

    data object CaughtUp : NextStep
}
