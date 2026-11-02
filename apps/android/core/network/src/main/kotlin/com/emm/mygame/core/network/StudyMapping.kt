package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.BusyStudySlot
import com.emm.mygame.core.network.generated.models.FiefOverviewArts
import com.emm.mygame.core.network.generated.models.FiefOverviewArtsSmithing
import com.emm.mygame.core.network.generated.models.FiefOverviewArtsSmithingNextLevel
import com.emm.mygame.core.network.generated.models.StudySlot as WireStudySlot
import kotlin.time.Duration.Companion.seconds

internal fun WireStudySlot.toStudySlot(): StudySlot? = when (this) {
    is WireStudySlot.IdleWrapper -> StudySlot.Idle
    is WireStudySlot.BusyWrapper -> value.toBusyStudy()
}

private fun BusyStudySlot.toBusyStudy(): StudySlot? {
    val artKind: ArtKind = art.toArtKind() ?: return null
    return StudySlot.Busy(art = artKind, targetLevel = targetLevel, finishesAt = finishesAt.toKotlinInstant())
}

private fun BusyStudySlot.Art.toArtKind(): ArtKind? = when (this) {
    BusyStudySlot.Art.smithing -> ArtKind.Smithing
    BusyStudySlot.Art.masonry -> ArtKind.Masonry
    BusyStudySlot.Art.unknown_default_open_api -> null
}

internal fun FiefOverviewArts.toArtStates(): List<ArtState>? {
    val drawn: List<Pair<ArtKind, FiefOverviewArtsSmithing?>> = listOf(
        ArtKind.Smithing to smithing,
        ArtKind.Masonry to masonry,
    )
    return drawn.map { (kind: ArtKind, art: FiefOverviewArtsSmithing?) -> art?.toArtState(kind) ?: return null }
}

private fun FiefOverviewArtsSmithing.toArtState(kind: ArtKind): ArtState? {
    val resourceKind: ResourceKind = resource.toResourceKind() ?: return null
    return ArtState(
        kind = kind,
        level = level,
        resource = resourceKind,
        ratePercent = ratePercent.toInt(),
        nextLevel = nextLevel?.toNextArtLevel(),
    )
}

private fun FiefOverviewArtsSmithingNextLevel.toNextArtLevel(): NextArtLevel = NextArtLevel(
    level = level,
    cost = cost.toResourceCosts(),
    duration = durationSeconds.seconds,
    requiredLibraryLevel = requiredLibraryLevel,
    ratePercent = ratePercent.toInt(),
)

private fun FiefOverviewArtsSmithing.Resource.toResourceKind(): ResourceKind? = when (this) {
    FiefOverviewArtsSmithing.Resource.wood -> ResourceKind.Wood
    FiefOverviewArtsSmithing.Resource.stone -> ResourceKind.Stone
    FiefOverviewArtsSmithing.Resource.iron -> ResourceKind.Iron
    FiefOverviewArtsSmithing.Resource.gold -> ResourceKind.Gold
    FiefOverviewArtsSmithing.Resource.food -> ResourceKind.Food
    FiefOverviewArtsSmithing.Resource.unknown_default_open_api -> null
}
