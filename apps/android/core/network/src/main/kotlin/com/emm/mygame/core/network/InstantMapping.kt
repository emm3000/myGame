package com.emm.mygame.core.network

import java.time.OffsetDateTime
import kotlin.time.Instant

internal fun OffsetDateTime.toKotlinInstant(): Instant = Instant.fromEpochMilliseconds(toInstant().toEpochMilli())
