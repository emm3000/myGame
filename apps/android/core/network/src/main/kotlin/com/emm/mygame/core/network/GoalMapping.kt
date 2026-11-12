package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.Goal
import com.emm.mygame.core.network.generated.models.PendingGoal
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.generated.models.UnderwayGoal

internal fun Goal.toTownGoal(): TownGoal? = when (this) {
    is Goal.PendingWrapper -> value.toTownGoal()
    is Goal.UnderwayWrapper -> value.toTownGoal()
}

internal fun TownOverview.Tip.toTipKind(): TipKind? = when (this) {
    TownOverview.Tip.people -> TipKind.People
    TownOverview.Tip.seasons -> TipKind.Seasons
    TownOverview.Tip.waitingList -> TipKind.WaitingList
    TownOverview.Tip.office -> TipKind.Office
    TownOverview.Tip.jobs -> TipKind.Jobs
    TownOverview.Tip.fullStore -> TipKind.FullStore
    TownOverview.Tip.unknown_default_open_api -> null
}

internal fun TipKind.toWireTip(): String = when (this) {
    TipKind.People -> TownOverview.Tip.people
    TipKind.Seasons -> TownOverview.Tip.seasons
    TipKind.WaitingList -> TownOverview.Tip.waitingList
    TipKind.Office -> TownOverview.Tip.office
    TipKind.Jobs -> TownOverview.Tip.jobs
    TipKind.FullStore -> TownOverview.Tip.fullStore
}.value

private fun PendingGoal.toTownGoal(): TownGoal? {
    val kind: TownBuildingKind = building.toTownBuildingKind() ?: return null
    return TownGoal(
        position = position,
        count = count,
        building = kind,
        level = level,
        state = TownGoal.State.Pending(resources = missing.resources.toCosts(), people = missing.people),
    )
}

private fun UnderwayGoal.toTownGoal(): TownGoal? {
    val kind: TownBuildingKind = building.toTownBuildingKind() ?: return null
    return TownGoal(position = position, count = count, building = kind, level = level, state = TownGoal.State.Underway)
}

private fun PendingGoal.Building.toTownBuildingKind(): TownBuildingKind? = when (this) {
    PendingGoal.Building.homes -> TownBuildingKind.Homes
    PendingGoal.Building.farm -> TownBuildingKind.Farm
    PendingGoal.Building.factory -> TownBuildingKind.Factory
    PendingGoal.Building.powerStation -> TownBuildingKind.PowerStation
    PendingGoal.Building.storage -> TownBuildingKind.Storage
    PendingGoal.Building.school -> TownBuildingKind.School
    PendingGoal.Building.office -> TownBuildingKind.Office
    PendingGoal.Building.unknown_default_open_api -> null
}

private fun UnderwayGoal.Building.toTownBuildingKind(): TownBuildingKind? = when (this) {
    UnderwayGoal.Building.homes -> TownBuildingKind.Homes
    UnderwayGoal.Building.farm -> TownBuildingKind.Farm
    UnderwayGoal.Building.factory -> TownBuildingKind.Factory
    UnderwayGoal.Building.powerStation -> TownBuildingKind.PowerStation
    UnderwayGoal.Building.storage -> TownBuildingKind.Storage
    UnderwayGoal.Building.school -> TownBuildingKind.School
    UnderwayGoal.Building.office -> TownBuildingKind.Office
    UnderwayGoal.Building.unknown_default_open_api -> null
}
