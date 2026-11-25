package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Instant

internal fun TownSnapshot.readInstants(): List<Instant> = listOfNotNull(job?.nextInstant(), seasonEndsAt)

internal fun TownSnapshot.readInstantsAfter(now: Instant): List<Instant> =
    readInstants().filter { instant: Instant -> instant > now }

internal fun TownSnapshot.Job.nextInstant(): Instant = when (phase) {
    TownSnapshot.JobPhase.Outbound -> arrivesAt
    TownSnapshot.JobPhase.Working -> leavesAt
    TownSnapshot.JobPhase.Returning -> returnsAt
}
