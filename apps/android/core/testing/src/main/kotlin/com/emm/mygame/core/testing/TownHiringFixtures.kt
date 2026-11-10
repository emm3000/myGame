package com.emm.mygame.core.testing

import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot

val workerTerms: TownSnapshot.HireTerms = TownSnapshot.HireTerms(
    costs = listOf(TownSnapshot.Cost(TownResourceKind.Money, 40)),
    secondsPerHire = 60,
    people = 1,
    requiredOfficeLevel = 1,
)

val truckTerms: TownSnapshot.HireTerms = TownSnapshot.HireTerms(
    costs = listOf(
        TownSnapshot.Cost(TownResourceKind.Money, 80),
        TownSnapshot.Cost(TownResourceKind.Material, 60),
    ),
    secondsPerHire = 180,
    people = 1,
    requiredOfficeLevel = 3,
)

fun hiringOf(
    order: TownSnapshot.HiringOrder? = null,
    workers: Int = 0,
    trucks: Int = 0,
    worker: TownSnapshot.HireTerms = workerTerms,
    truck: TownSnapshot.HireTerms = truckTerms,
): TownSnapshot.Hiring = TownSnapshot.Hiring(
    order = order,
    hires = mapOf(TownHireKind.Worker to workers, TownHireKind.Truck to trucks),
    terms = mapOf(TownHireKind.Worker to worker, TownHireKind.Truck to truck),
)
