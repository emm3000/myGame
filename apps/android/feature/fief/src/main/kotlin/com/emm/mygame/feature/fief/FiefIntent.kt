package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.BuildingKind

sealed interface FiefIntent {

    data object RetryTapped : FiefIntent

    data object SignOutTapped : FiefIntent

    data class UpgradeTapped(val building: BuildingKind) : FiefIntent

    data class CancelTapped(val building: BuildingKind, val targetLevel: Int) : FiefIntent

    data class StudyTapped(val art: ArtKind) : FiefIntent

    data class StudyCancelTapped(val art: ArtKind, val targetLevel: Int) : FiefIntent
}
