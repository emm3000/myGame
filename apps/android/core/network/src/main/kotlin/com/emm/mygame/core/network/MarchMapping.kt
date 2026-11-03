package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.FiefOverviewBuildingsSawmillNextLevelCost
import com.emm.mygame.core.network.generated.models.FiefOverviewForageTerms
import com.emm.mygame.core.network.generated.models.FiefOverviewForageTermsYieldPerHourLowlands
import com.emm.mygame.core.network.generated.models.FiefOverviewSeason
import com.emm.mygame.core.network.generated.models.FiefOverviewUnits
import com.emm.mygame.core.network.generated.models.MarchState
import java.time.OffsetDateTime

internal fun FiefOverview.toMappedMarch(): MappedMarch? {
    val away: AwayMarch? = march?.toAwayMarch()
    val terms: ForageTerms? = forageTerms.toForageTerms()
    val percents: SeasonPercents? = season?.toSeasonPercents()
    val isMarchUnknown: Boolean = march != null && away == null
    val isSeasonUnknown: Boolean = season != null && percents == null
    if (isMarchUnknown || isSeasonUnknown || terms == null) return null
    return MappedMarch(
        coordinates = PlotAddress(province = coordinates.province, plot = coordinates.plot),
        march = away,
        forageTerms = terms,
        season = percents,
    )
}

internal fun List<UnitCount>.toWireUnits(): FiefOverviewUnits = FiefOverviewUnits(
    infantry = countOf(UnitKind.Infantry),
    cavalry = countOf(UnitKind.Cavalry),
    archer = countOf(UnitKind.Archer),
    settler = countOf(UnitKind.Settler),
)

private fun List<UnitCount>.countOf(kind: UnitKind): Int =
    filter { count: UnitCount -> count.unit == kind }.sumOf { count: UnitCount -> count.count }

private data class MarchFields(
    val order: MarchOrder,
    val province: Int,
    val plot: Int,
    val units: FiefOverviewUnits,
    val departedAt: OffsetDateTime,
    val arrivesAt: OffsetDateTime,
    val leavesAt: OffsetDateTime,
    val returnsAt: OffsetDateTime,
    val recalledAt: OffsetDateTime?,
    val loot: FiefOverviewBuildingsSawmillNextLevelCost,
)

private fun MarchState.toAwayMarch(): AwayMarch? {
    val fields: MarchFields = fields()
    val party: List<UnitCount> = UnitKind.entries.map { kind: UnitKind ->
        UnitCount(kind, fields.units.wireCountOf(kind) ?: return null)
    }
    return AwayMarch(
        order = fields.order,
        target = PlotAddress(province = fields.province, plot = fields.plot),
        units = party,
        departedAt = fields.departedAt.toKotlinInstant(),
        arrivesAt = fields.arrivesAt.toKotlinInstant(),
        leavesAt = fields.leavesAt.toKotlinInstant(),
        returnsAt = fields.returnsAt.toKotlinInstant(),
        recalledAt = fields.recalledAt?.toKotlinInstant(),
        loot = fields.loot.toResourceCosts()
            .filter { cost: ResourceCost -> cost.amount > 0 }
            .map { cost: ResourceCost -> ResourceQuantity(cost.kind, cost.amount) },
    )
}

private fun MarchState.fields(): MarchFields = when (this) {
    is MarchState.ForageWrapper -> with(value) {
        MarchFields(
            MarchOrder.Forage, province, plot, units, departedAt, arrivesAt, leavesAt, returnsAt, recalledAt, loot,
        )
    }
    is MarchState.AttackWrapper -> with(value) {
        MarchFields(
            MarchOrder.Attack, province, plot, units, departedAt, arrivesAt, leavesAt, returnsAt, recalledAt, loot,
        )
    }
    is MarchState.FoundWrapper -> with(value) {
        MarchFields(
            MarchOrder.Found, province, plot, units, departedAt, arrivesAt, leavesAt, returnsAt, recalledAt, loot,
        )
    }
    is MarchState.TransportWrapper -> with(value) {
        MarchFields(
            MarchOrder.Transport, province, plot, units, departedAt, arrivesAt, leavesAt, returnsAt, recalledAt, loot,
        )
    }
}

private fun FiefOverviewUnits.wireCountOf(kind: UnitKind): Int? = when (kind) {
    UnitKind.Infantry -> infantry
    UnitKind.Cavalry -> cavalry
    UnitKind.Archer -> archer
    UnitKind.Settler -> settler
}

private fun FiefOverviewForageTerms.toForageTerms(): ForageTerms? {
    val yields: List<Pair<Terrain, FiefOverviewForageTermsYieldPerHourLowlands?>> = listOf(
        Terrain.Lowlands to yieldPerHour.lowlands,
        Terrain.Uplands to yieldPerHour.uplands,
        Terrain.Ridges to yieldPerHour.ridges,
    )
    return ForageTerms(
        secondsPerProvince = secondsPerProvince,
        secondsPerPlot = secondsPerPlot,
        maxStayHours = maxStayHours,
        yieldPerHour = yields.associate { (terrain: Terrain, rates: FiefOverviewForageTermsYieldPerHourLowlands?) ->
            terrain to (rates?.toQuantities() ?: return null)
        },
    )
}

private fun FiefOverviewForageTermsYieldPerHourLowlands.toQuantities(): List<ResourceQuantity> = listOf(
    ResourceQuantity(ResourceKind.Wood, wood.toLong()),
    ResourceQuantity(ResourceKind.Stone, stone.toLong()),
    ResourceQuantity(ResourceKind.Iron, iron.toLong()),
    ResourceQuantity(ResourceKind.Gold, gold.toLong()),
    ResourceQuantity(ResourceKind.Food, food.toLong()),
)

private fun FiefOverviewSeason.toSeasonPercents(): SeasonPercents? {
    val percents: List<Pair<ResourceKind, Int?>> = listOf(
        ResourceKind.Wood to multiplierPercent.wood,
        ResourceKind.Stone to multiplierPercent.stone,
        ResourceKind.Iron to multiplierPercent.iron,
        ResourceKind.Gold to multiplierPercent.gold,
        ResourceKind.Food to multiplierPercent.food,
    )
    return SeasonPercents(
        road = durationPercent.road,
        loot = percents.associate { (kind: ResourceKind, percent: Int?) -> kind to (percent ?: return null) },
    )
}
