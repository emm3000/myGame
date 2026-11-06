package com.emm.mygame.feature.school

sealed interface LessonWordsIntent {

    data object ScreenShown : LessonWordsIntent

    data object ScreenHidden : LessonWordsIntent

    data object RetryTapped : LessonWordsIntent

    data object NextWordTapped : LessonWordsIntent
}
