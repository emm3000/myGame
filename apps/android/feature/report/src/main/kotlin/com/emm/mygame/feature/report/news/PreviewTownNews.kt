package com.emm.mygame.feature.report.news

import com.emm.mygame.core.model.town.TownAmount
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.news.TownNews
import kotlin.time.Instant

internal val previewReceivedAt: Instant = Instant.parse("2026-11-05T10:00:00Z")

internal val previewTownNews: List<TownNews> = listOf(
    TownNews.BuildingWorkFinished(
        occurredAt = Instant.parse("2026-11-05T09:40:00Z"),
        building = TownBuildingKind.Farm,
        level = 2,
    ),
    TownNews.BuildingWorkStopped(
        occurredAt = Instant.parse("2026-11-05T09:20:00Z"),
        building = TownBuildingKind.Storage,
        level = 3,
        refund = listOf(TownAmount(TownResourceKind.Money, 300L), TownAmount(TownResourceKind.Material, 150L)),
    ),
    TownNews.JobBack(
        occurredAt = Instant.parse("2026-11-05T08:15:00Z"),
        site = TownSite(region = 1, area = 2, site = 1),
        pay = listOf(TownAmount(TownResourceKind.Money, 120L), TownAmount(TownResourceKind.Material, 40L)),
    ),
    TownNews.SkillEarned(
        occurredAt = Instant.parse("2026-11-04T18:30:00Z"),
        resource = TownResourceKind.Food,
        ratePercent = 5,
    ),
    TownNews.HiringDelivered(
        occurredAt = Instant.parse("2026-11-04T17:00:00Z"),
        hire = TownHireKind.Worker,
        count = 2,
    ),
    TownNews.HiringStopped(
        occurredAt = Instant.parse("2026-11-04T16:10:00Z"),
        hire = TownHireKind.Truck,
        delivered = 1,
        stopped = 2,
        refund = listOf(TownAmount(TownResourceKind.Money, 400L), TownAmount(TownResourceKind.Power, 60L)),
    ),
)
