package com.emm.mygame.feature.fief

import androidx.lifecycle.viewModelScope
import app.cash.turbine.ReceiveTurbine
import com.emm.mygame.core.network.ArtKind
import com.emm.mygame.core.network.ArtState
import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.BuildQueue
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.BuildingState
import com.emm.mygame.core.network.CombatTerms
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.ForageTerms
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.network.NextArtLevel
import com.emm.mygame.core.network.NextLevel
import com.emm.mygame.core.network.Peasants
import com.emm.mygame.core.network.PlotAddress
import com.emm.mygame.core.network.RecruitOrder
import com.emm.mygame.core.network.RecruitTerms
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.ResourceQuantity
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.network.StudySlot
import com.emm.mygame.core.network.UnitCount
import com.emm.mygame.core.network.UnitKind
import com.emm.mygame.core.network.UnitState
import com.emm.mygame.core.network.WaitingUpgrade
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope

internal val firstReadAt: Instant = Instant.fromEpochMilliseconds(1_000_000)

internal fun TestScope.openFief(
    fiefs: FakeFiefRepository,
    deviceNow: Instant = firstReadAt,
    sessions: FakeSessionRepository = FakeSessionRepository(),
): FiefViewModel {
    val viewModel: FiefViewModel = FiefViewModel(fiefs, sessions, TestClock(testScheduler, deviceNow))
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}

internal suspend fun ReceiveTurbine<FiefUiState>.awaitContentWhere(
    isWanted: (FiefUiState.Content) -> Boolean,
): FiefUiState.Content {
    var content: FiefUiState.Content = awaitContent()
    while (!isWanted(content)) content = awaitContent()
    return content
}

internal suspend fun ReceiveTurbine<FiefUiState>.awaitContent(): FiefUiState.Content {
    var item: FiefUiState = awaitItem()
    while (item !is FiefUiState.Content) item = awaitItem()
    return item
}

internal fun FiefUiState.Content.remaining(): Duration = (slot as FiefUiState.SlotLine.Busy).remaining

internal fun busySlot(finishesIn: Duration): BuildSlot =
    BuildSlot.Busy(BuildingKind.Sawmill, targetLevel = 3, finishesAt = firstReadAt + finishesIn)

internal fun fief(
    resources: List<StoredResource> = listOf(wood(amount = 500, ratePerHour = 60.0)),
    slot: BuildSlot = BuildSlot.Idle,
    readAt: Instant = firstReadAt,
    buildings: List<BuildingState> = emptyList(),
    peasants: Peasants = Peasants(free = 10, supplied = 10, lowestFree = 10),
    queue: BuildQueue = BuildQueue(entries = emptyList(), cap = 4),
    study: StudySlot = StudySlot.Idle,
    arts: List<ArtState> = listOf(smithing(level = 0), masonry()),
    units: List<UnitState> = army(),
    recruitOrder: RecruitOrder? = null,
    march: AwayMarch? = null,
): FiefSnapshot = FiefSnapshot(
    id = FiefId(FIEF_ID),
    name = "Vadoalto",
    readAt = readAt,
    coordinates = PlotAddress(province = 1, plot = 1),
    resources = resources,
    slot = slot,
    buildings = buildings,
    peasants = peasants,
    queue = queue,
    study = study,
    arts = arts,
    units = units,
    recruitOrder = recruitOrder,
    march = march,
    forageTerms = ForageTerms(
        secondsPerProvince = 600,
        secondsPerPlot = 60,
        maxStayHours = 8,
        yieldPerHour = emptyMap(),
    ),
    season = null,
    combatTerms = CombatTerms(lootPerStrength = 60),
)

internal fun sawmill(level: Int = 0): BuildingState = building(BuildingKind.Sawmill, level)

internal fun library(level: Int): BuildingState = building(BuildingKind.Library, level)

internal fun smithing(level: Int, requiredLibraryLevel: Int = 1): ArtState = ArtState(
    kind = ArtKind.Smithing,
    level = level,
    resource = ResourceKind.Iron,
    ratePercent = level * 5,
    nextLevel = NextArtLevel(
        level = level + 1,
        cost = listOf(
            ResourceCost(ResourceKind.Wood, 120),
            ResourceCost(ResourceKind.Stone, 80),
            ResourceCost(ResourceKind.Iron, 150),
            ResourceCost(ResourceKind.Gold, 60),
            ResourceCost(ResourceKind.Food, 0),
        ),
        duration = 30.minutes,
        requiredLibraryLevel = requiredLibraryLevel,
        ratePercent = (level + 1) * 5,
    ),
)

internal fun masonry(): ArtState =
    ArtState(kind = ArtKind.Masonry, level = 10, resource = ResourceKind.Stone, ratePercent = 50, nextLevel = null)

internal fun studyingSmithing(
    targetLevel: Int,
    finishesIn: Duration,
    cost: List<ResourceCost> = smithing(level = targetLevel - 1).nextLevel?.cost.orEmpty(),
): StudySlot = StudySlot.Busy(
    ArtKind.Smithing,
    targetLevel = targetLevel,
    finishesAt = firstReadAt + finishesIn,
    cost = cost,
)

internal fun army(infantryAtHome: Int = 0, infantryAway: Int = 0): List<UnitState> = listOf(
    unit(UnitKind.Infantry, count = infantryAtHome + infantryAway, away = infantryAway, barracksLevel = 1),
    unit(UnitKind.Cavalry, count = 0, away = 0, barracksLevel = 3),
    unit(UnitKind.Archer, count = 0, away = 0, barracksLevel = 2),
    unit(UnitKind.Settler, count = 0, away = 0, barracksLevel = 5),
)

private fun unit(kind: UnitKind, count: Int, away: Int, barracksLevel: Int): UnitState = UnitState(
    kind = kind,
    count = count,
    away = away,
    barracksLevel = barracksLevel,
    strength = 1,
    carry = 48,
    roadPercent = 100,
    terms = RecruitTerms(
        cost = listOf(
            ResourceCost(ResourceKind.Wood, 20),
            ResourceCost(ResourceKind.Stone, 0),
            ResourceCost(ResourceKind.Iron, 10),
            ResourceCost(ResourceKind.Gold, 0),
            ResourceCost(ResourceKind.Food, 30),
        ),
        peasants = 1,
        perUnit = 68.seconds,
    ),
)

internal fun levyOfInfantry(count: Int, delivered: Int, startedBefore: Duration): RecruitOrder {
    val startedAt: Instant = firstReadAt - startedBefore
    return RecruitOrder(
        unit = UnitKind.Infantry,
        count = count,
        delivered = delivered,
        perUnit = 1.minutes,
        startedAt = startedAt,
        endsAt = startedAt + count.minutes,
    )
}

internal fun forageOfInfantry(
    count: Int,
    arrivesIn: Duration,
    foragesFor: Duration,
    order: MarchOrder = MarchOrder.Forage,
): AwayMarch {
    val arrivesAt: Instant = firstReadAt + arrivesIn
    val departedAt: Instant = arrivesAt - 6.minutes
    val leavesAt: Instant = arrivesAt + foragesFor
    return AwayMarch(
        order = order,
        target = PlotAddress(province = 1, plot = 7),
        units = listOf(
            UnitCount(UnitKind.Infantry, count),
            UnitCount(UnitKind.Cavalry, 0),
            UnitCount(UnitKind.Archer, 0),
            UnitCount(UnitKind.Settler, 0),
        ),
        departedAt = departedAt,
        arrivesAt = arrivesAt,
        leavesAt = leavesAt,
        returnsAt = leavesAt + (arrivesAt - departedAt),
        recalledAt = null,
        loot = listOf(ResourceQuantity(ResourceKind.Wood, 42)),
        camp = null,
        isFought = false,
        foundingName = null,
        cargo = emptyList(),
    )
}

internal fun barracks(level: Int = 0): BuildingState = building(BuildingKind.Barracks, level)

private fun building(kind: BuildingKind, level: Int): BuildingState = BuildingState(
    kind = kind,
    level = level,
    nextLevel = NextLevel(
        level = level + 1,
        cost = listOf(
            ResourceCost(ResourceKind.Wood, 60),
            ResourceCost(ResourceKind.Stone, 0),
            ResourceCost(ResourceKind.Iron, 15),
        ),
        duration = 2.minutes,
        peasants = 1,
    ),
)

internal fun waitingSawmill(targetLevel: Int, finishesAt: Instant): WaitingUpgrade =
    WaitingUpgrade(BuildingKind.Sawmill, targetLevel = targetLevel, finishesAt = finishesAt)

internal fun iron(amount: Long): StoredResource =
    StoredResource(ResourceKind.Iron, amount = amount, ratePerHour = 0.0, capacity = 1000)

internal fun wood(amount: Long, ratePerHour: Double, capacity: Long = 1000): StoredResource =
    StoredResource(ResourceKind.Wood, amount = amount, ratePerHour = ratePerHour, capacity = capacity)

internal const val FIEF_ID: String = "509eadd5-6b34-4ea3-8e91-2b38744bd385"
