package com.emm.mygame.feature.account.settings

data class SettingsNavigation(
    val onNotificationSettingsOpen: () -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
)
