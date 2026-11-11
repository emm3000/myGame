package com.emm.mygame.feature.map

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
        send = if (send == MapUiState.SendRequest.Waiting) send else MapUiState.SendRequest.Idle,
        callBack = if (callBack == MapUiState.CallBackRequest.Waiting) callBack else MapUiState.CallBackRequest.Idle,
    )

    fun closed(): MapChoices = keptAfterRead().copy(chosen = null, entries = JobEntries.first)

    fun choosing(site: Int): MapChoices = copy(
        chosen = if (chosen == site) null else site,
        entries = JobEntries.first,
        send = if (send == MapUiState.SendRequest.Waiting) send else MapUiState.SendRequest.Idle,
    )

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
): MapUiState.Content = MapUiState.Content(
    areaLine = MapUiState.AreaLine(area = map.area, terrain = map.terrain),
    previousArea = (map.area - 1).takeIf { area: Int -> area >= 1 },
    nextArea = (map.area + 1).takeIf { area: Int -> area <= map.lastArea },
    sites = map.sites.map(::siteRowOf),
    form = choices.chosen?.let { site: Int -> town.jobFormOf(site, choices.entries) },
    send = choices.send,
    jobOut = town.job?.jobOutAt(now, gap),
    callBack = choices.callBack,
)

private fun siteRowOf(site: RegionMap.Site): MapUiState.SiteRow {
    val town: RegionMap.SiteTown = site.town ?: return MapUiState.SiteRow.Free(site.site)
    if (town.isOwn) return MapUiState.SiteRow.Own(site.site, town.name)
    return MapUiState.SiteRow.Town(site.site, town.name)
}

private fun TownSnapshot.jobFormOf(site: Int, entries: JobEntries): MapUiState.JobForm = MapUiState.JobForm(
    site = site,
    workers = entries.workers,
    trucks = entries.trucks,
    hours = entries.hours,
    workersAtHome = hiring.hires.getValue(TownHireKind.Worker),
    trucksAtHome = hiring.hires.getValue(TownHireKind.Truck),
    block = jobBlockOf(entries),
)

private fun TownSnapshot.jobBlockOf(entries: JobEntries): MapUiState.JobBlock? {
    val team: Map<TownHireKind, Int> = entries.team() ?: return MapUiState.JobBlock.CountNeeded
    if (team.values.sum() == 0) return MapUiState.JobBlock.InvalidTeam
    if (entries.hoursCount() == null) return MapUiState.JobBlock.HoursNeeded
    if (job != null) return MapUiState.JobBlock.TeamAlreadyOut
    val short: TownHireKind = TownHireKind.entries.firstOrNull { hire: TownHireKind ->
        team.getValue(hire) > hiring.hires.getValue(hire)
    } ?: return null
    return MapUiState.JobBlock.NotEnoughHiresAtHome(short, team.getValue(short), hiring.hires.getValue(short))
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
        pay = TownResourceKind.entries.mapNotNull { resource: TownResourceKind ->
            pay.getValue(resource).takeIf { amount: Long -> amount > 0 }?.let { amount: Long ->
                MapUiState.PayLine(resource, amount)
            }
        },
        canCallBack = phase != TownSnapshot.JobPhase.Returning,
    )
}
