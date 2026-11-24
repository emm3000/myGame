package com.emm.mygame.feature.town

import com.emm.mygame.core.model.learning.LessonId

sealed interface TownStatusIntent {

    data class ScreenShown(val screen: TownStatusScreen) : TownStatusIntent

    data object ScreenHidden : TownStatusIntent

    data object NoticeClosed : TownStatusIntent

    data object ScreenAnswered : TownStatusIntent

    data object TryAgainTapped : TownStatusIntent

    data class ReleasedLessonTapped(val lesson: LessonId) : TownStatusIntent

    data class SchoolLessonDrawn(val lesson: LessonId?) : TownStatusIntent
}
