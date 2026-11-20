package com.emm.mygame.core.projection

import kotlin.time.Instant

data class ReadyMinuteCase(
    val name: String,
    val needs: List<ResourceNeed>,
    val readAt: Instant,
    val expectedReady: Instant?,
)
