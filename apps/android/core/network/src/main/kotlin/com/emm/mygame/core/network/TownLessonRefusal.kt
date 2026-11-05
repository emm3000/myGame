package com.emm.mygame.core.network

sealed interface TownLessonRefusal {

    data class LearningCapReached(val cap: Int, val inLearning: Int) : TownLessonRefusal

    data object StudySlotBusy : TownLessonRefusal

    data object LessonSchoolTooLow : TownLessonRefusal

    data object LessonAlreadyStudied : TownLessonRefusal

    data object LessonUnderStudy : TownLessonRefusal

    data object LessonStudyNotFound : TownLessonRefusal

    data object TownNotFound : TownLessonRefusal

    data object Unrecognized : TownLessonRefusal
}
