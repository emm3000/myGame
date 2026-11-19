package com.emm.mygame.feature.school

sealed interface SchoolTextIntent {

    data object RetryTapped : SchoolTextIntent

    data class WordTapped(val at: SchoolTextUiState.SpanAt) : SchoolTextIntent
}
