package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.BuildingWorkFinishedNews
import com.emm.mygame.core.network.generated.models.BuildingWorkNotFoundErrorParams
import com.emm.mygame.core.network.generated.models.BuildingWorkStoppedNews
import com.emm.mygame.core.network.generated.models.BuildingWorkStoppedNewsParams
import com.emm.mygame.core.network.generated.models.HiringDeliveredNews
import com.emm.mygame.core.network.generated.models.HiringDeliveredNewsParams
import com.emm.mygame.core.network.generated.models.HiringStoppedNews
import com.emm.mygame.core.network.generated.models.HiringStoppedNewsParams
import com.emm.mygame.core.network.generated.models.JobBackNewsParamsSite
import com.emm.mygame.core.network.generated.models.NotEnoughResourcesErrorParamsMissing
import com.emm.mygame.core.network.generated.models.Report
import com.emm.mygame.core.network.generated.models.SkillEarnedNews
import com.emm.mygame.core.network.generated.models.SkillEarnedNewsParams
import com.emm.mygame.core.network.generated.models.TownNewsItem

internal fun Report.toTownReport(): TownReport = TownReport(
    dueCount = dueCount,
    readFirst = readFirst.map(::LessonId),
    nextDueAt = nextDueAt?.toKotlinInstant(),
    news = news.mapNotNull(TownNewsItem::toTownNews),
)

private fun TownNewsItem.toTownNews(): TownNews? = when (this) {
    is TownNewsItem.BuildingworkfinishedWrapper -> value.toFinishedWork()
    is TownNewsItem.BuildingworkstoppedWrapper -> value.toStoppedWork()
    is TownNewsItem.LessonstudiedWrapper -> TownNews.LessonStudied(value.occurredAt.toKotlinInstant())
    is TownNewsItem.LessonstoppedWrapper -> TownNews.LessonStopped(value.occurredAt.toKotlinInstant())
    is TownNewsItem.SkillearnedWrapper -> value.toSkillEarned()
    is TownNewsItem.HiringdeliveredWrapper -> value.toHiringDelivered()
    is TownNewsItem.HiringstoppedWrapper -> value.toHiringStopped()
    is TownNewsItem.JobbackWrapper -> TownNews.JobBack(
        occurredAt = value.occurredAt.toKotlinInstant(),
        site = value.params.site.toTownSite(),
        pay = value.params.pay.toTownAmounts(),
    )
    is TownNewsItem.JobcalledbackWrapper -> TownNews.JobCalledBack(
        occurredAt = value.occurredAt.toKotlinInstant(),
        site = value.params.site.toTownSite(),
        pay = value.params.pay.toTownAmounts(),
    )
    is TownNewsItem.CleanupdoneWrapper -> TownNews.CleanUpDone(
        occurredAt = value.occurredAt.toKotlinInstant(),
        site = value.params.site.toTownSite(),
        reward = value.params.reward.toTownAmounts(),
    )
    is TownNewsItem.CleanupfailedWrapper ->
        TownNews.CleanUpFailed(value.occurredAt.toKotlinInstant(), value.params.site.toTownSite())
    is TownNewsItem.BecamecityWrapper -> TownNews.BecameCity(value.occurredAt.toKotlinInstant())
}

private fun BuildingWorkFinishedNews.toFinishedWork(): TownNews? {
    val building: TownBuildingKind = params.building.toTownBuildingKind() ?: return null
    return TownNews.BuildingWorkFinished(occurredAt.toKotlinInstant(), building, params.level)
}

private fun BuildingWorkStoppedNews.toStoppedWork(): TownNews? {
    val building: TownBuildingKind = params.building.toTownBuildingKind() ?: return null
    return TownNews.BuildingWorkStopped(occurredAt.toKotlinInstant(), building, params.level)
}

private fun SkillEarnedNews.toSkillEarned(): TownNews? {
    val resource: TownResourceKind = params.resource.toTownResourceKind() ?: return null
    return TownNews.SkillEarned(occurredAt.toKotlinInstant(), resource, params.ratePercent)
}

private fun HiringDeliveredNews.toHiringDelivered(): TownNews? {
    val hire: TownHireKind = params.hire.toTownHireKind() ?: return null
    return TownNews.HiringDelivered(occurredAt.toKotlinInstant(), hire, params.count)
}

private fun HiringStoppedNews.toHiringStopped(): TownNews? {
    val hire: TownHireKind = params.hire.toTownHireKind() ?: return null
    return TownNews.HiringStopped(occurredAt.toKotlinInstant(), hire, params.delivered, params.stopped)
}

internal fun JobBackNewsParamsSite.toTownSite(): TownSite = TownSite(region = region, area = area, site = site)

private fun NotEnoughResourcesErrorParamsMissing.toTownAmounts(): List<TownAmount> = listOf(
    TownAmount(TownResourceKind.Money, money.toLong()),
    TownAmount(TownResourceKind.Food, food.toLong()),
    TownAmount(TownResourceKind.Power, power.toLong()),
    TownAmount(TownResourceKind.Material, material.toLong()),
).filter { held: TownAmount -> held.amount > 0 }

private fun BuildingWorkNotFoundErrorParams.Building.toTownBuildingKind(): TownBuildingKind? = when (this) {
    BuildingWorkNotFoundErrorParams.Building.homes -> TownBuildingKind.Homes
    BuildingWorkNotFoundErrorParams.Building.farm -> TownBuildingKind.Farm
    BuildingWorkNotFoundErrorParams.Building.factory -> TownBuildingKind.Factory
    BuildingWorkNotFoundErrorParams.Building.powerStation -> TownBuildingKind.PowerStation
    BuildingWorkNotFoundErrorParams.Building.storage -> TownBuildingKind.Storage
    BuildingWorkNotFoundErrorParams.Building.school -> TownBuildingKind.School
    BuildingWorkNotFoundErrorParams.Building.office -> TownBuildingKind.Office
    BuildingWorkNotFoundErrorParams.Building.unknown_default_open_api -> null
}

private fun BuildingWorkStoppedNewsParams.Building.toTownBuildingKind(): TownBuildingKind? = when (this) {
    BuildingWorkStoppedNewsParams.Building.homes -> TownBuildingKind.Homes
    BuildingWorkStoppedNewsParams.Building.farm -> TownBuildingKind.Farm
    BuildingWorkStoppedNewsParams.Building.factory -> TownBuildingKind.Factory
    BuildingWorkStoppedNewsParams.Building.powerStation -> TownBuildingKind.PowerStation
    BuildingWorkStoppedNewsParams.Building.storage -> TownBuildingKind.Storage
    BuildingWorkStoppedNewsParams.Building.school -> TownBuildingKind.School
    BuildingWorkStoppedNewsParams.Building.office -> TownBuildingKind.Office
    BuildingWorkStoppedNewsParams.Building.unknown_default_open_api -> null
}

private fun SkillEarnedNewsParams.Resource.toTownResourceKind(): TownResourceKind? = when (this) {
    SkillEarnedNewsParams.Resource.money -> TownResourceKind.Money
    SkillEarnedNewsParams.Resource.food -> TownResourceKind.Food
    SkillEarnedNewsParams.Resource.power -> TownResourceKind.Power
    SkillEarnedNewsParams.Resource.material -> TownResourceKind.Material
    SkillEarnedNewsParams.Resource.unknown_default_open_api -> null
}

private fun HiringDeliveredNewsParams.Hire.toTownHireKind(): TownHireKind? = when (this) {
    HiringDeliveredNewsParams.Hire.worker -> TownHireKind.Worker
    HiringDeliveredNewsParams.Hire.truck -> TownHireKind.Truck
    HiringDeliveredNewsParams.Hire.unknown_default_open_api -> null
}

private fun HiringStoppedNewsParams.Hire.toTownHireKind(): TownHireKind? = when (this) {
    HiringStoppedNewsParams.Hire.worker -> TownHireKind.Worker
    HiringStoppedNewsParams.Hire.truck -> TownHireKind.Truck
    HiringStoppedNewsParams.Hire.unknown_default_open_api -> null
}
