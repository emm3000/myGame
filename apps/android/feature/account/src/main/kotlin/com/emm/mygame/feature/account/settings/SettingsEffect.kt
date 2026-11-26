package com.emm.mygame.feature.account.settings

sealed interface SettingsEffect {

    data object AskNotifications : SettingsEffect

    data object SigningOut : SettingsEffect

    data object SignedOut : SettingsEffect
}
