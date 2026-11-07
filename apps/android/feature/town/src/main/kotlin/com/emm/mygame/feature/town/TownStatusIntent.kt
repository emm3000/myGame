package com.emm.mygame.feature.town

sealed interface TownStatusIntent {

    data class ScreenShown(val screen: TownStatusScreen) : TownStatusIntent

    data object ScreenHidden : TownStatusIntent

    data object NoticeClosed : TownStatusIntent
}
