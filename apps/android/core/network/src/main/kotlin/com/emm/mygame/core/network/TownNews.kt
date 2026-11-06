package com.emm.mygame.core.network

import kotlin.time.Instant

sealed interface TownNews {

    val occurredAt: Instant

    data class BuildingWorkFinished(
        override val occurredAt: Instant,
        val building: TownBuildingKind,
        val level: Int,
    ) : TownNews

    data class BuildingWorkStopped(
        override val occurredAt: Instant,
        val building: TownBuildingKind,
        val level: Int,
    ) : TownNews

    data class LessonStudied(override val occurredAt: Instant) : TownNews

    data class LessonStopped(override val occurredAt: Instant) : TownNews

    data class SkillEarned(
        override val occurredAt: Instant,
        val resource: TownResourceKind,
        val ratePercent: Int,
    ) : TownNews

    data class HiringDelivered(
        override val occurredAt: Instant,
        val hire: TownHireKind,
        val count: Int,
    ) : TownNews

    data class HiringStopped(
        override val occurredAt: Instant,
        val hire: TownHireKind,
        val delivered: Int,
        val stopped: Int,
    ) : TownNews

    data class JobBack(
        override val occurredAt: Instant,
        val site: TownSite,
        val pay: List<TownAmount>,
    ) : TownNews

    data class JobCalledBack(
        override val occurredAt: Instant,
        val site: TownSite,
        val pay: List<TownAmount>,
    ) : TownNews

    data class CleanUpDone(
        override val occurredAt: Instant,
        val site: TownSite,
        val reward: List<TownAmount>,
    ) : TownNews

    data class CleanUpFailed(override val occurredAt: Instant, val site: TownSite) : TownNews

    data class BecameCity(override val occurredAt: Instant) : TownNews
}
