package com.emm.mygame.feature.signin

sealed interface SettingsEffect {

    data object AskNotifications : SettingsEffect
}
