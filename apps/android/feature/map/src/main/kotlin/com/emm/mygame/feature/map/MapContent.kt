package com.emm.mygame.feature.map

import com.emm.mygame.core.network.JobQuoteResult
import com.emm.mygame.core.network.JobTarget
import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
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

internal data class QuoteAsk(
    val target: JobTarget,
    val team: Map<TownHireKind, Int>,
    val hours: Int,
    val seasonEndsAt: Instant?,
)

internal fun quoteAskOf(map: RegionMap, town: TownSnapshot, choices: MapChoices): QuoteAsk? {
    val site: Int = choices.chosen ?: return null
    val team: Map<TownHireKind, Int> = choices.entries.team() ?: return null
    if (team.values.sum() == 0) return null
    val hours: Int = choices.entries.hoursCount() ?: return null
    return QuoteAsk(JobTarget(map.area, site), team, hours, town.seasonEndsAt)
}

internal fun payQuoteOf(result: JobQuoteResult): MapUiState.PayQuote = when (result) {
    is JobQuoteResult.Quoted -> MapUiState.PayQuote.Quoted(payLinesOf(result.pay))
    is JobQuoteResult.Refused -> MapUiState.PayQuote.Refused(result.refusal)
    JobQuoteResult.Unreachable -> MapUiState.PayQuote.Unreachable
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
    quote: MapUiState.PayQuote?,
): MapUiState.Content = MapUiState.Content(
    areaLine = MapUiState.AreaLine(area = map.area, terrain = map.terrain),
    previousArea = (map.area - 1).takeIf { area: Int -> area >= 1 },
    nextArea = (map.area + 1).takeIf { area: Int -> area <= map.lastArea },
    sites = map.sites.map(::siteRowOf),
    form = choices.chosen?.let { site: Int -> town.jobFormOf(site, choices.entries, quote) },
    send = choices.send,
    jobOut = town.job?.jobOutAt(now, gap),
    callBack = choices.callBack,
)

private fun siteRowOf(site: RegionMap.Site): MapUiState.SiteRow {
    val town: RegionMap.SiteTown = site.town ?: return MapUiState.SiteRow.Free(site.site)
    if (town.isOwn) return MapUiState.SiteRow.Own(site.site, town.name)
    return MapUiState.SiteRow.Town(site.site, town.name)
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
    quote = quote,
)

private fun JobEntries.jobBlock(): MapUiState.JobBlock? {
    val team: Map<TownHireKind, Int> = team() ?: return MapUiState.JobBlock.CountNeeded
    if (team.values.sum() == 0) return MapUiState.JobBlock.InvalidTeam
    if (hoursCount() == null) return MapUiState.JobBlock.HoursNeeded
    return null
}

private fun TownSnapshot.Job.jobOutAt(now: Instant, gap: Duration): MapUiState.JobOut {
    val next: Instant = nextInstant()
    return MapUiState.JobOut(
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

private fun payLinesOf(pay: Map<TownResourceKind, Long>): List<MapUiState.PayLine> =
    TownResourceKind.entries.mapNotNull { resource: TownResourceKind ->
        pay.getValue(resource).takeIf { amount: Long -> amount > 0 }?.let { amount: Long ->
            MapUiState.PayLine(resource, amount)
        }
    }
