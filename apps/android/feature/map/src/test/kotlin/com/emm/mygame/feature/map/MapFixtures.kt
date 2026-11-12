package com.emm.mygame.feature.map

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.RegionMapResult
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WasteSize
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent

internal val readInstant: Instant = Instant.parse("2026-11-05T10:00:00Z")

internal fun regionMapOf(
    area: Int = 1,
    lastArea: Int = 3,
    terrain: Terrain = Terrain.River,
    sites: List<RegionMap.Site> = listOf(
        RegionMap.Site(site = 1, town = null, waste = null),
        RegionMap.Site(site = 2, town = RegionMap.SiteTown(name = "Hillcrest", isOwn = false), waste = null),
        RegionMap.Site(site = 3, town = RegionMap.SiteTown(name = "Riverton", isOwn = true), waste = null),
    ),
): RegionMap = RegionMap(region = 1, area = area, lastArea = lastArea, terrain = terrain, sites = sites)

internal fun jobOf(
    phase: TownSnapshot.JobPhase = TownSnapshot.JobPhase.Outbound,
    workers: Int = 2,
    trucks: Int = 1,
    pay: Map<TownResourceKind, Long> = mapOf(
        TownResourceKind.Money to 120L,
        TownResourceKind.Food to 0L,
        TownResourceKind.Power to 0L,
        TownResourceKind.Material to 40L,
    ),
    sentAt: Instant = readInstant,
): TownSnapshot.Job = TownSnapshot.Job(
    site = TownSite(region = 1, area = 1, site = 1),
    team = mapOf(TownHireKind.Worker to workers, TownHireKind.Truck to trucks),
    task = TownSnapshot.JobTask.Hours(hours = 2),
    pay = pay,
    phase = phase,
    sentAt = sentAt,
    arrivesAt = sentAt + 10.minutes,
    leavesAt = sentAt + 10.minutes + 2.hours,
    returnsAt = sentAt + 20.minutes + 2.hours,
    calledBackAt = null,
)

internal fun wasteSiteOf(site: Int = 4, size: WasteSize = WasteSize.Medium, waste: Int = 12): RegionMap.Site =
    RegionMap.Site(site = site, town = null, waste = RegionMap.SiteWaste(size = size, waste = waste))

internal fun cleanUpOf(
    phase: TownSnapshot.JobPhase = TownSnapshot.JobPhase.Outbound,
    pay: Map<TownResourceKind, Long> = mapOf(
        TownResourceKind.Money to 24L,
        TownResourceKind.Food to 0L,
        TownResourceKind.Power to 0L,
        TownResourceKind.Material to 36L,
    ),
    sentAt: Instant = readInstant,
    calledBackAt: Instant? = null,
): TownSnapshot.Job = TownSnapshot.Job(
    site = TownSite(region = 1, area = 1, site = 4),
    team = mapOf(TownHireKind.Worker to 3, TownHireKind.Truck to 1),
    task = TownSnapshot.JobTask.CleanUp(size = WasteSize.Medium, waste = 12),
    pay = pay,
    phase = phase,
    sentAt = sentAt,
    arrivesAt = sentAt + 10.minutes,
    leavesAt = sentAt + 10.minutes,
    returnsAt = sentAt + 20.minutes,
    calledBackAt = calledBackAt,
)

internal fun townOf(
    workers: Int = 3,
    trucks: Int = 1,
    job: TownSnapshot.Job? = null,
    seasonEndsAt: Instant? = null,
    readAt: Instant = readInstant,
): TownSnapshot = TownSnapshot(
    name = "Riverton",
    label = TownLabel.Town,
    seasonInForce = null,
    seasonEndsAt = seasonEndsAt,
    stocks = emptyList(),
    people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
    buildings = listOf(TownBuildingKind.Homes, TownBuildingKind.Office).map { kind: TownBuildingKind ->
        TownSnapshot.Building(kind, level = 1, next = null)
    },
    work = TownSnapshot.Work(slot = null, waitingList = emptyList(), cap = 2),
    lessons = emptyList(),
    skills = emptyList(),
    learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
    lessonSlot = null,
    hiring = hiringOf(workers = workers, trucks = trucks),
    job = job,
    nextStep = NextStep.CaughtUp,
    nextDueAt = null,
    readAt = readAt,
)

internal fun contentOf(viewModel: MapViewModel): MapUiState.Content = viewModel.state.value as MapUiState.Content

internal fun TestScope.mapViewModelOf(towns: FakeTownRepository, start: Instant = readInstant): MapViewModel {
    val viewModel: MapViewModel = MapViewModel(towns, TestClock(testScheduler, start))
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}

internal fun TestScope.mapReading(
    towns: FakeTownRepository,
    town: TownSnapshot = townOf(),
    map: RegionMap = regionMapOf(),
): MapViewModel {
    towns.answerRead(TownReadResult.Read(town))
    towns.regions.answerMap(RegionMapResult.Read(map))
    val viewModel: MapViewModel = mapViewModelOf(towns)
    runCurrent()
    return viewModel
}
