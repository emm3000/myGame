package com.emm.mygame.core.network

import kotlin.time.Instant

data class FiefSnapshot(
    val id: FiefId,
    val name: String,
    val readAt: Instant,
    val coordinates: PlotAddress,
    val resources: List<StoredResource>,
    val slot: BuildSlot,
    val buildings: List<BuildingState>,
    val peasants: Peasants,
    val queue: BuildQueue,
    val study: StudySlot,
    val arts: List<ArtState>,
    val units: List<UnitState>,
    val recruitOrder: RecruitOrder?,
    val march: AwayMarch?,
    val forageTerms: ForageTerms,
    val season: SeasonPercents?,
)
