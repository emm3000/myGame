package com.emm.mygame.feature.town.hiring

import com.emm.mygame.core.model.town.hiring.TownHireKind
import kotlin.time.Instant

data class HiringTarget(val hire: TownHireKind, val startedAt: Instant)
