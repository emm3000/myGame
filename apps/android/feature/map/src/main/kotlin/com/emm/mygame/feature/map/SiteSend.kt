package com.emm.mygame.feature.map

import com.emm.mygame.core.network.JobTarget
import com.emm.mygame.core.network.RegionMap
import com.emm.mygame.core.network.RegionRepository
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownJobResult

internal sealed interface SiteSend {

    val target: JobTarget

    val team: Map<TownHireKind, Int>

    data class Job(
        override val target: JobTarget,
        override val team: Map<TownHireKind, Int>,
        val hours: Int,
    ) : SiteSend

    data class CleanUp(override val target: JobTarget, override val team: Map<TownHireKind, Int>) : SiteSend
}

internal fun RegionMap.isWasteSite(site: Int): Boolean =
    sites.any { held: RegionMap.Site -> held.site == site && held.waste != null }

internal fun siteSendOf(map: RegionMap, site: Int, entries: JobEntries): SiteSend? {
    val target: JobTarget = JobTarget(map.area, site)
    val team: Map<TownHireKind, Int> = entries.team() ?: return null
    if (map.isWasteSite(site)) return SiteSend.CleanUp(target, team)
    return entries.hoursCount()?.let { hours: Int -> SiteSend.Job(target, team, hours) }
}

internal suspend fun RegionRepository.sent(request: SiteSend): TownJobResult = when (request) {
    is SiteSend.Job -> sendJob(request.target, request.team, request.hours)
    is SiteSend.CleanUp -> sendCleanUp(request.target, request.team)
}
