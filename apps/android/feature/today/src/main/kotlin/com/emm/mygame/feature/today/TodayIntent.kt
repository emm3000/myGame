package com.emm.mygame.feature.today

import com.emm.mygame.core.model.learning.LessonId

sealed interface TodayIntent {

    data object ScreenShown : TodayIntent

    data object ScreenHidden : TodayIntent

    data object RetryTapped : TodayIntent

    data class StudyTapped(val lesson: LessonId) : TodayIntent
}
