package com.emm.mygame.core.network

import kotlin.time.Duration
import kotlin.time.Instant

data class TownSnapshot(
    val name: String,
    val label: TownLabel,
    val seasonEndsAt: Instant?,
    val stocks: List<Stock>,
    val people: People,
    val buildings: List<Building>,
    val work: Work,
    val lessonFinishesAt: Instant?,
    val readAt: Instant,
) {

    data class Stock(val kind: TownResourceKind, val amount: Long, val ratePerHour: Double, val capacity: Long)

    data class People(val supplied: Int, val free: Int, val atWork: Int)

    data class Building(val kind: TownBuildingKind, val level: Int, val next: NextLevel?)

    data class NextLevel(val level: Int, val costs: List<Cost>, val duration: Duration, val people: Int)

    data class Cost(val kind: TownResourceKind, val amount: Long)

    data class Work(val slot: WorkItem?, val waitingList: List<WorkItem>, val cap: Int)

    data class WorkItem(
        val building: TownBuildingKind,
        val level: Int,
        val startsAt: Instant,
        val finishesAt: Instant,
    )
}
