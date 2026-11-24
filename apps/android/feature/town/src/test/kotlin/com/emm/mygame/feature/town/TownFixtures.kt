package com.emm.mygame.feature.town

import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.SeasonDurationPercent
import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.SeasonProductionPercent
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.testing.hiringOf
import com.emm.mygame.feature.town.building.NextLevel
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

internal val isTab: SemanticsMatcher = SemanticsMatcher.expectValue(SemanticsProperties.Role, Role.Tab)

internal fun List<TownUiState.PlaceCard>.leveled(kind: TownBuildingKind, level: Int): List<TownUiState.PlaceCard> =
    map { place: TownUiState.PlaceCard -> if (place.kind == kind) place.copy(level = level) else place }

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
    wordsNeeded: TownSnapshot.WordsNeeded? = null,
): TownSnapshot.NextLevel = TownSnapshot.NextLevel(level, costs, duration, people, wordsNeeded)

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

internal fun openingOn(place: TownBuildingKind): NextStep = NextStep.CaughtUp(
    reason = CaughtUpReason.LessonsDone,
    goal = TownGoal(position = 1, count = 9, building = place, level = 1, state = TownGoal.State.Underway),
    text = null,
)

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
    nextStep: NextStep = NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null),
    nextDueAt: Instant? = null,
    readAt: Instant = readInstant,
    skills: List<TownSnapshot.EarnedSkill> = emptyList(),
    hiring: TownSnapshot.Hiring = hiringOf(),
    tip: TipKind? = null,
    releasedLessons: List<TownSnapshot.ReleasedLesson> = emptyList(),
    stableWordCount: Int = 0,
    retainedWordCount: Int = 0,
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
    texts = emptyList(),
    dueHoldoutChecks = emptyList(),
    hasBandStarted = false,
    bandLines = emptyList(),
    skills = skills,
    learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null, nextInLearningDueAt = null),
    stableWordCount = stableWordCount,
    retainedWordCount = retainedWordCount,
    lessonSlot = lessonSlot,
    hiring = hiring,
    job = null,
    nextStep = nextStep,
    tip = tip,
    nextDueAt = nextDueAt,
    readAt = readAt,
)

internal val idleHiring: TownUiState.Hiring = TownUiState.Hiring(
    order = TownUiState.HiringLine.Idle,
    hires = emptyList(),
    hireMark = null,
    place = TownUiState.HiringStatus.Idle,
    stop = TownUiState.HiringStopStatus.Idle,
)

internal val bareOffice: TownUiState.PlaceCard = TownUiState.PlaceCard(
    kind = TownBuildingKind.Office,
    level = 1,
    raisedFrom = null,
    isInWork = false,
    next = null,
    block = null,
)

internal fun shortOf(kind: TownResourceKind, amount: Long): TownUiState.BlockReason.Resources =
    TownUiState.BlockReason.Resources(listOf(TownUiState.Shortfall(kind, amount)), ready = null)

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
