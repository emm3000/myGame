package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.UNSCALED_PERCENT
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.jobs.RegionMap
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal fun mapContentOf(
    map: RegionMap,
    town: TownSnapshot,
    now: Instant,
    gap: Duration,
    choices: MapChoices,
    quote: QuoteAnswer?,
): MapUiState.Content = MapUiState.Content(
    areaLine = MapUiState.AreaLine(area = map.area, terrain = map.terrain),
    previousArea = (map.area - 1).takeIf { area: Int -> area >= 1 },
    nextArea = (map.area + 1).takeIf { area: Int -> area <= map.lastArea },
    sites = map.sites.map(::siteRowOf),
    form = choices.chosen?.let { site: Int -> town.siteFormOf(map, site, choices.entries, quote) },
    send = choices.send,
    jobOut = town.job?.jobOutAt(now, gap),
    callBack = choices.callBack,
)

private fun siteRowOf(site: RegionMap.Site): MapUiState.SiteRow {
    val town: RegionMap.SiteTown = site.town ?: return freeSiteRowOf(site.site, site.waste)
    if (town.isOwn) return MapUiState.SiteRow.Own(site.site, town.name)
    return MapUiState.SiteRow.Town(site.site, town.name)
}

private fun freeSiteRowOf(site: Int, waste: RegionMap.SiteWaste?): MapUiState.SiteRow =
    if (waste == null) MapUiState.SiteRow.Free(site) else MapUiState.SiteRow.Waste(site, waste.size, waste.waste)

private fun TownSnapshot.siteFormOf(
    map: RegionMap,
    site: Int,
    entries: JobEntries,
    quote: QuoteAnswer?,
): MapUiState.SiteForm {
    if (!map.isWasteSite(site)) return jobFormOf(site, entries, (quote as? QuoteAnswer.Job)?.quote)
    return MapUiState.CleanUpForm(
        site = site,
        workers = entries.workers,
        trucks = entries.trucks,
        workersAtHome = hiring.hires.getValue(TownHireKind.Worker),
        trucksAtHome = hiring.hires.getValue(TownHireKind.Truck),
        block = entries.teamBlock(),
        roadMark = roadMark(),
        quote = (quote as? QuoteAnswer.CleanUp)?.quote,
    )
}

private fun TownSnapshot.jobFormOf(
    site: Int,
    entries: JobEntries,
    quote: MapUiState.PayQuote?,
): MapUiState.JobForm = MapUiState.JobForm(
    site = site,
    workers = entries.workers,
    trucks = entries.trucks,
    hours = entries.hours,
    workersAtHome = hiring.hires.getValue(TownHireKind.Worker),
    trucksAtHome = hiring.hires.getValue(TownHireKind.Truck),
    block = entries.jobBlock(),
    roadMark = roadMark(),
    quote = quote,
)

private fun TownSnapshot.roadMark(): MapUiState.DurationMark? {
    val inForce: SeasonInForce = seasonInForce ?: return null
    val road: Int = inForce.durationPercent.road
    if (road == UNSCALED_PERCENT) return null
    return MapUiState.DurationMark(inForce.kind, percent = road)
}

private fun JobEntries.jobBlock(): MapUiState.JobBlock? {
    teamBlock()?.let { block: MapUiState.JobBlock -> return block }
    if (hoursCount() == null) return MapUiState.JobBlock.HoursNeeded
    return null
}

private fun JobEntries.teamBlock(): MapUiState.JobBlock? {
    val team: Map<TownHireKind, Int> = team() ?: return MapUiState.JobBlock.CountNeeded
    if (team.values.sum() == 0) return MapUiState.JobBlock.InvalidTeam
    return null
}

private fun TownSnapshot.Job.jobOutAt(now: Instant, gap: Duration): MapUiState.JobOut {
    val next: Instant = nextInstant()
    return MapUiState.JobOut(
        kind = kindOf(),
        site = site,
        workers = team.getValue(TownHireKind.Worker),
        trucks = team.getValue(TownHireKind.Truck),
        phase = phase,
        remaining = countdownTo(finishesAt = next, now = now),
        finishesAt = next - gap,
        pay = payLinesOf(pay),
        canCallBack = phase != TownSnapshot.JobPhase.Returning,
    )
}

private fun TownSnapshot.Job.kindOf(): MapUiState.JobKind = when (val held: TownSnapshot.JobTask = task) {
    is TownSnapshot.JobTask.Hours -> MapUiState.JobKind.Job
    is TownSnapshot.JobTask.CleanUp -> MapUiState.JobKind.CleanUp(waste = held.waste, outcome = cleanUpOutcome())
}

private fun TownSnapshot.Job.cleanUpOutcome(): MapUiState.CleanUpOutcome? {
    if (calledBackAt != null) return null
    val isPaid: Boolean = pay.values.any { amount: Long -> amount > 0 }
    if (phase == TownSnapshot.JobPhase.Returning) {
        return if (isPaid) MapUiState.CleanUpOutcome.Cleaned else MapUiState.CleanUpOutcome.NotCleaned
    }
    return if (isPaid) null else MapUiState.CleanUpOutcome.Short
}

internal fun payLinesOf(pay: Map<TownResourceKind, Long>): List<MapUiState.PayLine> =
    TownResourceKind.entries.mapNotNull { resource: TownResourceKind ->
        pay.getValue(resource).takeIf { amount: Long -> amount > 0 }?.let { amount: Long ->
            MapUiState.PayLine(resource, amount)
        }
    }
