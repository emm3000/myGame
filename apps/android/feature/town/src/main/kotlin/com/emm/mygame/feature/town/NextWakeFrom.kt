package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.nextWakeFrom(now: Instant, nextReadAt: Instant?, readyLeft: Duration?): Duration {
    val repaint: Duration = repaintDelay(listOfNotNull(nearestCountdownAt(now), readyLeft).minOrNull())
    return if (nextReadAt == null) repaint else minOf(repaint, nextReadAt - now)
}
