package com.emm.mygame.feature.map

import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.BuildQueue
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.CombatTerms
import com.emm.mygame.core.network.DueReviews
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
import com.emm.mygame.core.network.StoredResource
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
    archersAtHome: Int = 0,
    settlersAtHome: Int = 3,
    settlersAway: Int = 0,
    march: AwayMarch? = null,
    season: SeasonPercents? = null,
    stocks: List<StoredResource> = emptyList(),
): FiefSnapshot = FiefSnapshot(
    id = FiefId(FIEF_ID),
    name = "Sotoverde",
    readAt = readAt,
    coordinates = PlotAddress(province = 3, plot = 2),
    resources = stocks,
    slot = BuildSlot.Idle,
    buildings = emptyList(),
    peasants = Peasants(free = 10, supplied = 10, lowestFree = 10),
    queue = BuildQueue(entries = emptyList(), cap = 4),
    study = StudySlot.Idle,
    arts = emptyList(),
    units = listOf(
        unit(UnitKind.Infantry, infantryAtHome + infantryAway, infantryAway, strength = 1, carry = 48, road = 100),
        unit(UnitKind.Cavalry, cavalryAtHome, away = 0, strength = 2, carry = 120, road = 50),
        unit(UnitKind.Archer, archersAtHome, away = 0, strength = 1, carry = 24, road = 100),
        unit(UnitKind.Settler, settlersAtHome + settlersAway, settlersAway, strength = 0, carry = 0, road = 120),
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
    seasonInForce = null,
    seasonEndsAt = null,
    combatTerms = CombatTerms(lootPerStrength = 60),
    lessons = emptyList(),
    skills = emptyList(),
    reviews = DueReviews(due = emptyList(), nextDueAt = null),
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
    camp = null,
    isFought = false,
    foundingName = null,
    cargo = emptyList(),
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
        MapPlot(plot = 2, holder = PlotHolder.Own("Sotoverde", FiefId(FIEF_ID))),
        MapPlot(plot = 5, holder = PlotHolder.Camp(tier = 2, strength = 15)),
        MapPlot(plot = 6, holder = PlotHolder.Reserved(isOwn = false)),
        MapPlot(plot = 7, holder = PlotHolder.Free),
    ),
)

internal const val OTHER_FIEF_ID: String = "7c1e2f4a-0b3d-4e5f-9a8b-1c2d3e4f5a6b"

internal val ordersProvince: ProvinceMap = ProvinceMap(
    kingdom = 1,
    province = 3,
    lastProvince = 9,
    terrain = Terrain.Lowlands,
    plots = listOf(
        MapPlot(plot = 1, holder = PlotHolder.Held("Robledal")),
        MapPlot(plot = 2, holder = PlotHolder.Own("Sotoverde", FiefId(FIEF_ID))),
        MapPlot(plot = 4, holder = PlotHolder.Own("Vega", FiefId(OTHER_FIEF_ID))),
        MapPlot(plot = 5, holder = PlotHolder.Camp(tier = 2, strength = 15)),
        MapPlot(plot = 6, holder = PlotHolder.Reserved(isOwn = false)),
        MapPlot(plot = 7, holder = PlotHolder.Free),
        MapPlot(plot = 8, holder = PlotHolder.Camp(tier = 1, strength = 10)),
    ),
)

internal fun awayOn(order: MarchOrder, target: PlotAddress, units: List<UnitCount>): AwayMarch = AwayMarch(
    order = order,
    target = target,
    units = units,
    departedAt = readAt,
    arrivesAt = readAt + 3.minutes,
    leavesAt = readAt + 3.minutes,
    returnsAt = readAt + 6.minutes,
    recalledAt = null,
    loot = emptyList(),
    camp = null,
    isFought = false,
    foundingName = null,
    cargo = emptyList(),
)

private fun rates(wood: Long, food: Long): List<ResourceQuantity> = listOf(
    ResourceQuantity(ResourceKind.Wood, wood),
    ResourceQuantity(ResourceKind.Stone, 0),
    ResourceQuantity(ResourceKind.Iron, 0),
    ResourceQuantity(ResourceKind.Gold, 0),
    ResourceQuantity(ResourceKind.Food, food),
)

internal fun stock(kind: ResourceKind, amount: Long): StoredResource =
    StoredResource(kind = kind, amount = amount, ratePerHour = 0.0, capacity = 10_000)

private fun unit(kind: UnitKind, count: Int, away: Int, strength: Int, carry: Int, road: Int): UnitState = UnitState(
    kind = kind,
    count = count,
    away = away,
    barracksLevel = 1,
    strength = strength,
    carry = carry,
    roadPercent = road,
    terms = RecruitTerms(cost = emptyList(), peasants = 1, perUnit = 60.seconds),
)
