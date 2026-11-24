package com.emm.mygame.feature.school.text

sealed interface SchoolTextIntent {

    data object RetryTapped : SchoolTextIntent

    data class WordTapped(val at: SchoolTextUiState.SpanAt) : SchoolTextIntent
}
