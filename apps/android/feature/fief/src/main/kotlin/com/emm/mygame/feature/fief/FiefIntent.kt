package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.UnitKind
import kotlin.time.Instant

sealed interface FiefIntent {

    data object ScreenShown : FiefIntent

    data object RetryTapped : FiefIntent

    data object SignOutTapped : FiefIntent

    data class UpgradeTapped(val building: BuildingKind) : FiefIntent

    data class CancelTapped(val building: BuildingKind, val targetLevel: Int) : FiefIntent

    data class StudyTapped(val art: ArtKind) : FiefIntent

    data class StudyCancelTapped(val art: ArtKind, val targetLevel: Int) : FiefIntent

    data class RecruitEntryChanged(val unit: UnitKind, val entry: String) : FiefIntent

    data class RecruitTapped(val unit: UnitKind) : FiefIntent

    data class RecruitCancelTapped(val unit: UnitKind, val startedAt: Instant) : FiefIntent

    data class RecallTapped(val departedAt: Instant) : FiefIntent
}
