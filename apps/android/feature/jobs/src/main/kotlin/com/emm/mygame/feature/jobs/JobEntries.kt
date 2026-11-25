package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.hiring.TownHireKind

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

private fun wholeCountFrom(least: Int, entry: String): Int? {
    if (!wholeCount.matches(entry)) return null
    return entry.toIntOrNull()?.takeIf { count: Int -> count >= least }
}
