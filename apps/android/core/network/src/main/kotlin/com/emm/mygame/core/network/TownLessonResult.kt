package com.emm.mygame.core.network

sealed interface TownLessonResult {

    data class Answered(val town: TownSnapshot) : TownLessonResult

    data class Refused(val refusal: TownLessonRefusal) : TownLessonResult

    data object Unreachable : TownLessonResult
}
