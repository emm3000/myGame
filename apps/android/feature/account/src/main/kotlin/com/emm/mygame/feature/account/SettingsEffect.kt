package com.emm.mygame.feature.account

sealed interface SettingsEffect {

    data object AskNotifications : SettingsEffect
}
