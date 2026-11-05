package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId

sealed interface SchoolIntent {

    data object ScreenShown : SchoolIntent

    data object ScreenHidden : SchoolIntent

    data object RetryTapped : SchoolIntent

    data class StudyTapped(val lesson: LessonId) : SchoolIntent

    data class StopTapped(val lesson: LessonId) : SchoolIntent
}
