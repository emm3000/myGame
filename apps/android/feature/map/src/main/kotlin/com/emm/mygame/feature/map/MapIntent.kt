package com.emm.mygame.feature.map

sealed interface MapIntent {

    data object ScreenShown : MapIntent

    data object ScreenHidden : MapIntent

    data object RetryTapped : MapIntent

    data class AreaTapped(val area: Int) : MapIntent

    data object OwnAreaTapped : MapIntent

    data class SendTeamTapped(val site: Int) : MapIntent

    data class JobEntryChanged(val field: JobField, val entry: String) : MapIntent

    data object SendTapped : MapIntent

    data object CallBackTapped : MapIntent

    enum class JobField {
        Workers,
        Trucks,
        Hours,
    }
}
