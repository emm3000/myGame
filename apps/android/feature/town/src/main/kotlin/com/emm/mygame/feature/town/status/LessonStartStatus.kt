package com.emm.mygame.feature.town.status

import com.emm.mygame.core.model.town.school.TownLessonRefusal

sealed interface LessonStartStatus {

    data object Idle : LessonStartStatus

    data object Waiting : LessonStartStatus

    data class Refused(val refusal: TownLessonRefusal) : LessonStartStatus

    data object Unreachable : LessonStartStatus
}
