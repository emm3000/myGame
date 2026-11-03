package com.emm.mygame.feature.map

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.BuildQueue
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.ForageTerms
import com.emm.mygame.core.network.MapPlot
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.Peasants
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.PlotHolder
import com.emm.mygame.core.network.ProvinceMap
import com.emm.mygame.core.network.RecruitTerms
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.SeasonPercents
import com.emm.mygame.core.network.StudySlot
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.network.UnitState
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

internal val readAt: Instant = Instant.fromEpochMilliseconds(1_000_000)

internal const val FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"

internal fun fief(
    infantryAtHome: Int = 12,
    infantryAway: Int = 0,
    cavalryAtHome: Int = 4,
    march: AwayMarch? = null,
    season: SeasonPercents? = null,
): FiefSnapshot = FiefSnapshot(
    id = FiefId(FIEF_ID),
    name = "Sotoverde",
    readAt = readAt,
    coordinates = PlotAddress(province = 3, plot = 2),
    resources = emptyList(),
    slot = BuildSlot.Idle,
    buildings = emptyList(),
    peasants = Peasants(free = 10, supplied = 10, lowestFree = 10),
    queue = BuildQueue(entries = emptyList(), cap = 4),
    study = StudySlot.Idle,
    arts = emptyList(),
    units = listOf(
        unit(UnitKind.Infantry, count = infantryAtHome + infantryAway, away = infantryAway, carry = 48, road = 100),
        unit(UnitKind.Cavalry, count = cavalryAtHome, away = 0, carry = 120, road = 50),
        unit(UnitKind.Archer, count = 0, away = 0, carry = 24, road = 100),
        unit(UnitKind.Settler, count = 3, away = 0, carry = 0, road = 100),
    ),
    recruitOrder = null,
    march = march,
    forageTerms = ForageTerms(
        secondsPerProvince = 600,
        secondsPerPlot = 60,
        maxStayHours = 8,
        yieldPerHour = mapOf(Terrain.Lowlands to rates(wood = 5, food = 3)),
    ),
    season = season,
)

internal fun forage(target: PlotAddress, infantry: Int): AwayMarch = AwayMarch(
    order = MarchOrder.Forage,
    target = target,
    units = listOf(
        UnitCount(UnitKind.Infantry, infantry),
        UnitCount(UnitKind.Cavalry, 0),
        UnitCount(UnitKind.Archer, 0),
        UnitCount(UnitKind.Settler, 0),
    ),
    departedAt = readAt,
    arrivesAt = readAt + 5.minutes,
    leavesAt = readAt + 65.minutes,
    returnsAt = readAt + 70.minutes,
    recalledAt = null,
    loot = listOf(ResourceQuantity(ResourceKind.Wood, 15), ResourceQuantity(ResourceKind.Food, 9)),
)

internal fun season(road: Int = 100, food: Int = 100): SeasonPercents = SeasonPercents(
    road = road,
    loot = mapOf(
        ResourceKind.Wood to 100,
        ResourceKind.Stone to 100,
        ResourceKind.Iron to 100,
        ResourceKind.Gold to 100,
        ResourceKind.Food to food,
    ),
)

internal val mixedProvince: ProvinceMap = ProvinceMap(
    kingdom = 1,
    province = 3,
    lastProvince = 9,
    terrain = Terrain.Lowlands,
    plots = listOf(
        MapPlot(plot = 1, holder = PlotHolder.Held("Robledal")),
        MapPlot(plot = 2, holder = PlotHolder.Own("Sotoverde")),
        MapPlot(plot = 5, holder = PlotHolder.Camp(tier = 2, strength = 15)),
        MapPlot(plot = 6, holder = PlotHolder.Reserved(isOwn = false)),
        MapPlot(plot = 7, holder = PlotHolder.Free),
    ),
)

private fun rates(wood: Long, food: Long): List<ResourceQuantity> = listOf(
    ResourceQuantity(ResourceKind.Wood, wood),
    ResourceQuantity(ResourceKind.Stone, 0),
    ResourceQuantity(ResourceKind.Iron, 0),
    ResourceQuantity(ResourceKind.Gold, 0),
    ResourceQuantity(ResourceKind.Food, food),
)

private fun unit(kind: UnitKind, count: Int, away: Int, carry: Int, road: Int): UnitState = UnitState(
    kind = kind,
    count = count,
    away = away,
    barracksLevel = 1,
    carry = carry,
    roadPercent = road,
    terms = RecruitTerms(cost = emptyList(), peasants = 1, perUnit = 60.seconds),
)
