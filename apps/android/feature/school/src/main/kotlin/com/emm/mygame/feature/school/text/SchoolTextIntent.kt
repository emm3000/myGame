package com.emm.mygame.feature.school.text

import com.emm.mygame.core.ui.ReadingSpan

sealed interface SchoolTextIntent {

    data object RetryTapped : SchoolTextIntent

    data class WordTapped(val at: ReadingSpan) : SchoolTextIntent
}
