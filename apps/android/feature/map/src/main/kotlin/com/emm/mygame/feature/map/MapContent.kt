package com.emm.mygame.feature.map

import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.UNSCALED_PERCENT
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

private val wholeCount: Regex = Regex("^[0-9]+$")

internal data class JobEntries(val workers: String, val trucks: String, val hours: String) {

    fun with(field: MapIntent.JobField, entry: String): JobEntries = when (field) {
        MapIntent.JobField.Workers -> copy(workers = entry)
        MapIntent.JobField.Trucks -> copy(trucks = entry)
        MapIntent.JobField.Hours -> copy(hours = entry)
    }

    fun team(): Map<TownHireKind, Int>? {
        val workerCount: Int = wholeCountFrom(least = 0, entry = workers) ?: return null
        val truckCount: Int = wholeCountFrom(least = 0, entry = trucks) ?: return null
        return mapOf(TownHireKind.Worker to workerCount, TownHireKind.Truck to truckCount)
    }

    fun hoursCount(): Int? = wholeCountFrom(least = 1, entry = hours)

    companion object {
        val first: JobEntries = JobEntries(workers = "0", trucks = "0", hours = "1")
    }
}

internal data class MapChoices(
    val chosen: Int?,
    val entries: JobEntries,
    val send: MapUiState.SendRequest,
    val callBack: MapUiState.CallBackRequest,
) {

    fun keptAfterRead(): MapChoices = copy(
        send = unansweredSend(),
        callBack = if (callBack == MapUiState.CallBackRequest.Waiting) callBack else MapUiState.CallBackRequest.Idle,
    )

    fun closed(): MapChoices = keptAfterRead().copy(chosen = null, entries = JobEntries.first)

    fun choosing(site: Int): MapChoices = copy(
        chosen = if (chosen == site) null else site,
        entries = JobEntries.first,
        send = unansweredSend(),
    )

    fun entering(field: MapIntent.JobField, entry: String): MapChoices =
        copy(entries = entries.with(field, entry), send = unansweredSend())

    private fun unansweredSend(): MapUiState.SendRequest =
        if (send == MapUiState.SendRequest.Waiting) send else MapUiState.SendRequest.Idle

    companion object {
        val none: MapChoices = MapChoices(
            chosen = null,
            entries = JobEntries.first,
            send = MapUiState.SendRequest.Idle,
            callBack = MapUiState.CallBackRequest.Idle,
        )
    }
}

private fun wholeCountFrom(least: Int, entry: String): Int? {
    if (!wholeCount.matches(entry)) return null
    return entry.toIntOrNull()?.takeIf { count: Int -> count >= least }
}

internal fun TownSnapshot.readInstants(): List<Instant> = listOfNotNull(job?.nextInstant(), seasonEndsAt)

internal fun TownSnapshot.readInstantsAfter(now: Instant): List<Instant> =
    readInstants().filter { instant: Instant -> instant > now }

internal fun TownSnapshot.Job.nextInstant(): Instant = when (phase) {
    TownSnapshot.JobPhase.Outbound -> arrivesAt
    TownSnapshot.JobPhase.Working -> leavesAt
    TownSnapshot.JobPhase.Returning -> returnsAt
}

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
