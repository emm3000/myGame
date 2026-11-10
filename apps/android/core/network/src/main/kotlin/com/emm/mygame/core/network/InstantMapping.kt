package com.emm.mygame.core.network

import java.time.OffsetDateTime
import java.time.ZoneOffset
import kotlin.time.Instant

internal fun OffsetDateTime.toKotlinInstant(): Instant = Instant.fromEpochMilliseconds(toInstant().toEpochMilli())

internal fun Instant.toOffsetDateTime(): OffsetDateTime =
    OffsetDateTime.ofInstant(java.time.Instant.ofEpochMilli(toEpochMilliseconds()), ZoneOffset.UTC)
