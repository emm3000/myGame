package com.emm.mygame.feature.fief

import androidx.lifecycle.viewModelScope
import app.cash.turbine.ReceiveTurbine
import com.emm.mygame.core.network.BuildQueue
import com.emm.mygame.core.network.BuildSlot
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.BuildingState
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.NextLevel
import com.emm.mygame.core.network.Peasants
import com.emm.mygame.core.network.ResourceCost
import com.emm.mygame.core.network.ResourceKind
import com.emm.mygame.core.network.StoredResource
import com.emm.mygame.core.network.WaitingUpgrade
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
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
    peasants: Peasants = Peasants(free = 10, supplied = 10),
    queue: BuildQueue = BuildQueue(entries = emptyList(), cap = 4),
): FiefSnapshot = FiefSnapshot(
    id = FiefId(FIEF_ID),
    name = "Vadoalto",
    readAt = readAt,
    resources = resources,
    slot = slot,
    buildings = buildings,
    peasants = peasants,
    queue = queue,
)

internal fun sawmill(level: Int = 0): BuildingState = building(BuildingKind.Sawmill, level)

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
