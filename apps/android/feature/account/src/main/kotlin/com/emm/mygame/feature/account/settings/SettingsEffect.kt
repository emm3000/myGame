package com.emm.mygame.feature.account.settings

sealed interface SettingsEffect {

    data object AskNotifications : SettingsEffect
}
