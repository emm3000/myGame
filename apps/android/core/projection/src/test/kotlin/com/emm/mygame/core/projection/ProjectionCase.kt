package com.emm.mygame.core.projection

import kotlin.time.Instant

data class ProjectionCase(
    val name: String,
    val stock: ResourceStock,
    val readAt: Instant,
    val now: Instant,
    val expectedAmount: Long,
)
