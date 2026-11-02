package com.emm.mygame.core.network

import kotlin.time.Duration
import kotlin.time.Instant

data class RecruitOrder(
    val unit: UnitKind,
    val count: Int,
    val delivered: Int,
    val perUnit: Duration,
    val startedAt: Instant,
    val endsAt: Instant,
)
