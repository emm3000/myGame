package com.emm.mygame.feature.map

sealed interface MapIntent {

    data object RetryTapped : MapIntent

    data object PreviousTapped : MapIntent

    data object NextTapped : MapIntent

    data class JumpEntryChanged(val entry: String) : MapIntent

    data object JumpTapped : MapIntent

    data object OwnProvinceTapped : MapIntent
}
