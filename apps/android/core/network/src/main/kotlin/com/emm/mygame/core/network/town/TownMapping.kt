package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.SeasonDurationPercent
import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.SeasonProductionPercent
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.network.generated.models.BuildingWork
import com.emm.mygame.core.network.generated.models.PlaceHiringOrder
import com.emm.mygame.core.network.generated.models.ResourceAmounts
import com.emm.mygame.core.network.generated.models.StartBuildingWork
import com.emm.mygame.core.network.generated.models.TownJob
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.generated.models.TownOverviewBandLinesInner
import com.emm.mygame.core.network.generated.models.TownOverviewDueHoldoutChecksInner
import com.emm.mygame.core.network.generated.models.TownOverviewHiring
import com.emm.mygame.core.network.generated.models.TownOverviewHiringOrder
import com.emm.mygame.core.network.generated.models.TownOverviewHiringTermsWorker
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInner
import com.emm.mygame.core.network.generated.models.TownOverviewReleasedLessonsInner
import com.emm.mygame.core.network.generated.models.TownOverviewSeason
import com.emm.mygame.core.network.generated.models.TownOverviewSkillsInner
import com.emm.mygame.core.network.generated.models.TownOverviewStocksMoney
import com.emm.mygame.core.network.generated.models.TownOverviewTextsInner
import com.emm.mygame.core.network.generated.models.TownOverviewWork
import com.emm.mygame.core.network.holdout.toWeek
import com.emm.mygame.core.network.placement.toBand
import com.emm.mygame.core.network.platform.toKotlinInstant
import com.emm.mygame.core.network.town.building.toBuildings
import com.emm.mygame.core.network.town.guidance.toNextStep
import com.emm.mygame.core.network.town.guidance.toTipKind
import com.emm.mygame.core.network.town.jobs.toJob
import com.emm.mygame.core.network.town.school.toEarnedSkill
import com.emm.mygame.core.network.town.school.toLearning
import com.emm.mygame.core.network.town.school.toLesson
import com.emm.mygame.core.network.town.school.toLessonSlot
import com.emm.mygame.core.network.town.school.toReleasedLesson
import com.emm.mygame.core.network.town.school.toTextTitle

internal fun TownOverview.toSnapshot(): TownSnapshot? {
    val townLabel: TownLabel = label.toTownLabel() ?: return null
    val places: List<TownSnapshot.Building> = toBuildings() ?: return null
    val townWork: TownSnapshot.Work = work.toWork() ?: return null
    val school: TownSchool = toTownSchool() ?: return null
    val step: NextStep = nextStep.toNextStep() ?: return null
    val townHiring: TownSnapshot.Hiring = hiring.toHiring() ?: return null
    val townJob: TownSnapshot.Job? = job?.let { out: TownJob -> out.toJob() ?: return null }
    return TownSnapshot(
        name = name,
        label = townLabel,
        seasonInForce = season?.toSeasonInForce(),
        seasonEndsAt = season?.endsAt?.toKotlinInstant(),
        stocks = listOf(
            stocks.money.toStock(TownResourceKind.Money),
            stocks.food.toStock(TownResourceKind.Food),
            stocks.power.toStock(TownResourceKind.Power),
            stocks.material.toStock(TownResourceKind.Material),
        ),
        people = TownSnapshot.People(supplied = people.supplied, free = people.free, atWork = people.atWork),
        buildings = places,
        work = townWork,
        lessons = school.shelved,
        releasedLessons = school.released,
        texts = texts.map(TownOverviewTextsInner::toTextTitle),
        dueHoldoutChecks = dueHoldoutChecks.mapNotNull(TownOverviewDueHoldoutChecksInner::toDueHoldoutCheck),
        hasBandStarted = hasBandStarted,
        bandLines = bandLines.mapNotNull(TownOverviewBandLinesInner::toBandLine),
        skills = school.skills,
        learning = learning.toLearning(),
        stableWordCount = stableWordCount,
        retainedWordCount = retainedWordCount,
        lessonSlot = lessonSlot?.toLessonSlot(),
        hiring = townHiring,
        job = townJob,
        nextStep = step,
        tip = tip?.toTipKind(),
        nextDueAt = nextDueAt?.toKotlinInstant(),
        readAt = readAt.toKotlinInstant(),
    )
}

private fun TownOverviewDueHoldoutChecksInner.toDueHoldoutCheck(): TownSnapshot.DueHoldoutCheck? {
    val checkBand: PlacementBand = band.toBand() ?: return null
    val checkWeek: HoldoutCheckWeek = week.toWeek() ?: return null
    return TownSnapshot.DueHoldoutCheck(checkBand, checkWeek)
}

private fun TownOverviewBandLinesInner.toBandLine(): TownSnapshot.BandLine? {
    val lineBand: PlacementBand = band.toBand() ?: return null
    return TownSnapshot.BandLine(lineBand, count, total)
}

internal fun TownBuildingKind.toWireBuilding(): StartBuildingWork.Building = when (this) {
    TownBuildingKind.Homes -> StartBuildingWork.Building.homes
    TownBuildingKind.Farm -> StartBuildingWork.Building.farm
    TownBuildingKind.Factory -> StartBuildingWork.Building.factory
    TownBuildingKind.PowerStation -> StartBuildingWork.Building.powerStation
    TownBuildingKind.Storage -> StartBuildingWork.Building.storage
    TownBuildingKind.School -> StartBuildingWork.Building.school
    TownBuildingKind.Office -> StartBuildingWork.Building.office
}

internal fun TownHireKind.toWireHire(): PlaceHiringOrder.Hire = when (this) {
    TownHireKind.Worker -> PlaceHiringOrder.Hire.worker
    TownHireKind.Truck -> PlaceHiringOrder.Hire.truck
}

private class TownSchool(
    val shelved: List<TownSnapshot.Lesson>,
    val released: List<TownSnapshot.ReleasedLesson>,
    val skills: List<TownSnapshot.EarnedSkill>,
)

private fun TownOverview.toTownSchool(): TownSchool? {
    val shelved: List<TownSnapshot.Lesson> = lessons.map { lesson: TownOverviewLessonsInner ->
        lesson.toLesson() ?: return null
    }
    val released: List<TownSnapshot.ReleasedLesson> = releasedLessons.map { lesson: TownOverviewReleasedLessonsInner ->
        lesson.toReleasedLesson() ?: return null
    }
    val earned: List<TownSnapshot.EarnedSkill> = skills.map { skill: TownOverviewSkillsInner ->
        skill.toEarnedSkill() ?: return null
    }
    return TownSchool(shelved, released, earned)
}

private fun TownOverviewWork.toWork(): TownSnapshot.Work? {
    val waitingItems: List<TownSnapshot.WorkItem> = waitingList.map { item: BuildingWork ->
        item.toWorkItem() ?: return null
    }
    val slotItem: TownSnapshot.WorkItem? = slot?.let { item: BuildingWork -> item.toWorkItem() ?: return null }
    return TownSnapshot.Work(slot = slotItem, waitingList = waitingItems, cap = cap)
}

private fun TownOverviewHiring.toHiring(): TownSnapshot.Hiring? {
    val open: TownSnapshot.HiringOrder? = order?.let { placed: TownOverviewHiringOrder ->
        placed.toHiringOrder() ?: return null
    }
    return TownSnapshot.Hiring(
        order = open,
        hires = mapOf(TownHireKind.Worker to hires.worker, TownHireKind.Truck to hires.truck),
        terms = mapOf(
            TownHireKind.Worker to terms.worker.toHireTerms(),
            TownHireKind.Truck to terms.truck.toHireTerms(),
        ),
    )
}

private fun TownOverviewHiringOrder.toHiringOrder(): TownSnapshot.HiringOrder? {
    val kind: TownHireKind = hire.toTownHireKind() ?: return null
    return TownSnapshot.HiringOrder(
        hire = kind,
        count = count,
        delivered = delivered,
        secondsPerHire = secondsPerHire,
        startedAt = startedAt.toKotlinInstant(),
        endsAt = endsAt.toKotlinInstant(),
    )
}

private fun TownOverviewHiringOrder.Hire.toTownHireKind(): TownHireKind? = when (this) {
    TownOverviewHiringOrder.Hire.worker -> TownHireKind.Worker
    TownOverviewHiringOrder.Hire.truck -> TownHireKind.Truck
    TownOverviewHiringOrder.Hire.unknown_default_open_api -> null
}

private fun TownOverviewHiringTermsWorker.toHireTerms(): TownSnapshot.HireTerms = TownSnapshot.HireTerms(
    costs = cost.toCosts(),
    secondsPerHire = secondsPerHire,
    people = people,
    requiredOfficeLevel = requiredOfficeLevel,
)

private fun TownOverviewSeason.toSeasonInForce(): SeasonInForce? {
    val seasonKind: SeasonKind = kind.toSeasonKind() ?: return null
    return SeasonInForce(
        kind = seasonKind,
        year = year,
        productionPercent = SeasonProductionPercent(
            money = productionPercent.money,
            food = productionPercent.food,
            power = productionPercent.power,
            material = productionPercent.material,
        ),
        durationPercent = SeasonDurationPercent(
            build = durationPercent.build,
            study = durationPercent.study,
            hire = durationPercent.hire,
            road = durationPercent.road,
        ),
    )
}

private fun TownOverviewSeason.Kind.toSeasonKind(): SeasonKind? = when (this) {
    TownOverviewSeason.Kind.spring -> SeasonKind.Spring
    TownOverviewSeason.Kind.summer -> SeasonKind.Summer
    TownOverviewSeason.Kind.fall -> SeasonKind.Fall
    TownOverviewSeason.Kind.winter -> SeasonKind.Winter
    TownOverviewSeason.Kind.unknown_default_open_api -> null
}

private fun TownOverview.Label.toTownLabel(): TownLabel? = when (this) {
    TownOverview.Label.town -> TownLabel.Town
    TownOverview.Label.city -> TownLabel.City
    TownOverview.Label.unknown_default_open_api -> null
}

private fun TownOverviewStocksMoney.toStock(kind: TownResourceKind): TownSnapshot.Stock = TownSnapshot.Stock(
    kind = kind,
    amount = amount.toLong(),
    ratePerHour = ratePerHour,
    capacity = capacity.toLong(),
    fullAt = fullAt?.toKotlinInstant(),
)

internal fun ResourceAmounts.toCosts(): List<TownSnapshot.Cost> = listOf(
    TownSnapshot.Cost(TownResourceKind.Money, money.toLong()),
    TownSnapshot.Cost(TownResourceKind.Food, food.toLong()),
    TownSnapshot.Cost(TownResourceKind.Power, power.toLong()),
    TownSnapshot.Cost(TownResourceKind.Material, material.toLong()),
).filter { cost: TownSnapshot.Cost -> cost.amount > 0 }

private fun BuildingWork.toWorkItem(): TownSnapshot.WorkItem? {
    val kind: TownBuildingKind = building.toTownBuildingKind() ?: return null
    return TownSnapshot.WorkItem(
        building = kind,
        level = level,
        startsAt = startsAt.toKotlinInstant(),
        finishesAt = finishesAt.toKotlinInstant(),
    )
}

private fun BuildingWork.Building.toTownBuildingKind(): TownBuildingKind? = when (this) {
    BuildingWork.Building.homes -> TownBuildingKind.Homes
    BuildingWork.Building.farm -> TownBuildingKind.Farm
    BuildingWork.Building.factory -> TownBuildingKind.Factory
    BuildingWork.Building.powerStation -> TownBuildingKind.PowerStation
    BuildingWork.Building.storage -> TownBuildingKind.Storage
    BuildingWork.Building.school -> TownBuildingKind.School
    BuildingWork.Building.office -> TownBuildingKind.Office
    BuildingWork.Building.unknown_default_open_api -> null
}
