package com.emm.mygame

internal sealed interface FiefSwitcherIntent {

    data object ScreenShown : FiefSwitcherIntent

    data object FoundingApplied : FiefSwitcherIntent
}
