package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.PlayerScaffold

sealed interface SettingsIntent {

    data class ScaffoldPicked(val scaffold: PlayerScaffold) : SettingsIntent

    data object RetryTapped : SettingsIntent
}
