package com.emm.mygame.core.model.town.school

import com.emm.mygame.core.model.town.TownSnapshot

sealed interface TownLessonResult {

    data class Answered(val town: TownSnapshot) : TownLessonResult

    data class Refused(val refusal: TownLessonRefusal) : TownLessonResult

    data object Unreachable : TownLessonResult
}
