package com.emm.mygame.core.model.town.news

import com.emm.mygame.core.model.town.TownAmount
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
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
        val refund: List<TownAmount>,
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
        val refund: List<TownAmount>,
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
