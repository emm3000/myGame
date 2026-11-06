package com.emm.mygame.feature.town

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope

internal val readInstant: Instant = Instant.parse("2026-11-05T10:00:00Z")

internal fun stockOf(
    kind: TownResourceKind,
    amount: Long = 100,
    ratePerHour: Double = 0.0,
    capacity: Long = 1000,
): TownSnapshot.Stock = TownSnapshot.Stock(kind, amount, ratePerHour, capacity)

internal fun stocksOf(vararg changed: TownSnapshot.Stock): List<TownSnapshot.Stock> =
    TownResourceKind.entries.map { kind: TownResourceKind ->
        changed.firstOrNull { stock: TownSnapshot.Stock -> stock.kind == kind } ?: stockOf(kind)
    }

internal fun nextLevelOf(
    level: Int = 2,
    costs: List<TownSnapshot.Cost> = listOf(TownSnapshot.Cost(TownResourceKind.Money, 60)),
    duration: Duration = 2.minutes,
    people: Int = 3,
): TownSnapshot.NextLevel = TownSnapshot.NextLevel(level, costs, duration, people)

internal fun placesOf(vararg changed: TownSnapshot.Building): List<TownSnapshot.Building> =
    TownBuildingKind.entries.map { kind: TownBuildingKind ->
        changed.firstOrNull { place: TownSnapshot.Building -> place.kind == kind }
            ?: TownSnapshot.Building(kind, level = 1, next = nextLevelOf())
    }

internal fun workOf(
    building: TownBuildingKind = TownBuildingKind.Farm,
    level: Int = 2,
    startsAt: Instant = readInstant,
    lasting: Duration = 10.minutes,
): TownSnapshot.WorkItem = TownSnapshot.WorkItem(building, level, startsAt, startsAt + lasting)

internal fun lessonEndingAt(finishesAt: Instant): TownSnapshot.LessonSlot =
    TownSnapshot.LessonSlot(LessonId("lesson-1"), readInstant, finishesAt)

internal fun townOf(
    name: String = "Riverton",
    label: TownLabel = TownLabel.Town,
    stocks: List<TownSnapshot.Stock> = stocksOf(),
    people: TownSnapshot.People = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
    places: List<TownSnapshot.Building> = placesOf(),
    slot: TownSnapshot.WorkItem? = null,
    waitingList: List<TownSnapshot.WorkItem> = emptyList(),
    cap: Int = 2,
    seasonEndsAt: Instant? = null,
    lessonSlot: TownSnapshot.LessonSlot? = null,
    readAt: Instant = readInstant,
): TownSnapshot = TownSnapshot(
    name = name,
    label = label,
    seasonEndsAt = seasonEndsAt,
    stocks = stocks,
    people = people,
    buildings = places,
    work = TownSnapshot.Work(slot = slot, waitingList = waitingList, cap = cap),
    lessons = emptyList(),
    skills = emptyList(),
    learning = TownSnapshot.Learning(cap = 10, inLearning = 0),
    lessonSlot = lessonSlot,
    readAt = readAt,
)

internal fun contentOf(viewModel: TownViewModel): TownUiState.Content = viewModel.state.value as TownUiState.Content

internal fun moneyOf(viewModel: TownViewModel): TownUiState.StockLine =
    contentOf(viewModel).stocks.first { stock: TownUiState.StockLine -> stock.kind == TownResourceKind.Money }

internal fun placeOf(viewModel: TownViewModel, kind: TownBuildingKind): TownUiState.PlaceCard =
    contentOf(viewModel).places.first { place: TownUiState.PlaceCard -> place.kind == kind }

internal fun TestScope.townViewModelOf(
    towns: FakeTownRepository,
    start: Instant,
): TownViewModel {
    val viewModel: TownViewModel = TownViewModel(towns, TestClock(testScheduler, start))
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}
