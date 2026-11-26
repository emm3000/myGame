package com.emm.mygame.core.model.town.jobs

import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Instant

fun TownSnapshot.Job.nextInstant(): Instant = when (phase) {
    TownSnapshot.JobPhase.Outbound -> arrivesAt
    TownSnapshot.JobPhase.Working -> leavesAt
    TownSnapshot.JobPhase.Returning -> returnsAt
}
