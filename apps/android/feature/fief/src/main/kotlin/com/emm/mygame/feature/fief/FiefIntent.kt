package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.BuildingKind

sealed interface FiefIntent {

    data object RetryTapped : FiefIntent

    data class UpgradeTapped(val building: BuildingKind) : FiefIntent
}
