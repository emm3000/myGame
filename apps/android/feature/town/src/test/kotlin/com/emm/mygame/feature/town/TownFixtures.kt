package com.emm.mygame.feature.town

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.SeasonDurationPercent
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.SeasonProductionPercent
import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.nextStepCard
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.testing.hiringOf
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
    fullAt: Instant? = null,
): TownSnapshot.Stock = TownSnapshot.Stock(kind, amount, ratePerHour, capacity, fullAt)

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

internal fun placeAt(kind: TownBuildingKind, level: Int): TownSnapshot.Building =
    TownSnapshot.Building(kind, level = level, next = nextLevelOf())

internal fun workOf(
    building: TownBuildingKind = TownBuildingKind.Farm,
    level: Int = 2,
    startsAt: Instant = readInstant,
    lasting: Duration = 10.minutes,
): TownSnapshot.WorkItem = TownSnapshot.WorkItem(building, level, startsAt, startsAt + lasting)

internal fun lessonEndingAt(finishesAt: Instant): TownSnapshot.LessonSlot =
    TownSnapshot.LessonSlot(LessonId("lesson-1"), readInstant, finishesAt)

internal fun emptyNaming(): TownUiState.Naming = TownUiState.Naming("", TownUiState.NamingStatus.Idle)

internal val unscaledProduction: SeasonProductionPercent =
    SeasonProductionPercent(money = 100, food = 100, power = 100, material = 100)

internal fun seasonOf(
    kind: SeasonKind,
    production: SeasonProductionPercent = unscaledProduction,
    build: Int = 100,
    hire: Int = 100,
): SeasonInForce = SeasonInForce(
    kind = kind,
    year = 1,
    productionPercent = production,
    durationPercent = SeasonDurationPercent(build = build, study = 100, hire = hire, road = 100),
)

internal fun townOf(
    name: String = "Riverton",
    label: TownLabel = TownLabel.Town,
    stocks: List<TownSnapshot.Stock> = stocksOf(),
    people: TownSnapshot.People = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
    places: List<TownSnapshot.Building> = placesOf(),
    slot: TownSnapshot.WorkItem? = null,
    waitingList: List<TownSnapshot.WorkItem> = emptyList(),
    cap: Int = 2,
    seasonInForce: SeasonInForce? = null,
    seasonEndsAt: Instant? = null,
    lessonSlot: TownSnapshot.LessonSlot? = null,
    nextStep: NextStep = NextStep.CaughtUp(goal = null),
    nextDueAt: Instant? = null,
    readAt: Instant = readInstant,
    skills: List<TownSnapshot.EarnedSkill> = emptyList(),
    hiring: TownSnapshot.Hiring = hiringOf(),
    tip: TipKind? = null,
    releasedLessons: List<TownSnapshot.ReleasedLesson> = emptyList(),
): TownSnapshot = TownSnapshot(
    name = name,
    label = label,
    seasonInForce = seasonInForce,
    seasonEndsAt = seasonEndsAt,
    stocks = stocks,
    people = people,
    buildings = places,
    work = TownSnapshot.Work(slot = slot, waitingList = waitingList, cap = cap),
    lessons = emptyList(),
    releasedLessons = releasedLessons,
    hasBandStarted = false,
    skills = skills,
    learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
    lessonSlot = lessonSlot,
    hiring = hiring,
    job = null,
    nextStep = nextStep,
    tip = tip,
    nextDueAt = nextDueAt,
    readAt = readAt,
)

internal val idleOffice: TownUiState.OfficeLine = TownUiState.OfficeLine(
    hiring = TownUiState.HiringLine.Idle,
    hires = emptyList(),
    hireMark = null,
    place = TownUiState.HireStatus.Idle,
    stop = TownUiState.HireStopStatus.Idle,
)

internal fun shortOf(kind: TownResourceKind, amount: Long): TownUiState.BlockReason.Resources =
    TownUiState.BlockReason.Resources(listOf(TownUiState.Shortfall(kind, amount)), ready = null)

internal val caughtUpCard: NextStepCard = townOf().nextStepCard()

internal fun contentOf(viewModel: TownViewModel): TownUiState.Content = viewModel.state.value as TownUiState.Content

internal fun moneyOf(viewModel: TownViewModel): TownUiState.StockLine =
    contentOf(viewModel).stocks.first { stock: TownUiState.StockLine -> stock.kind == TownResourceKind.Money }

internal fun placeOf(viewModel: TownViewModel, kind: TownBuildingKind): TownUiState.PlaceCard =
    contentOf(viewModel).places.first { place: TownUiState.PlaceCard -> place.kind == kind }

internal fun TestScope.townViewModelOf(
    towns: FakeTownRepository,
    start: Instant,
    sessions: FakeSessionRepository = FakeSessionRepository(),
): TownViewModel {
    val viewModel: TownViewModel = TownViewModel(towns, sessions, TestClock(testScheduler, start))
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}
