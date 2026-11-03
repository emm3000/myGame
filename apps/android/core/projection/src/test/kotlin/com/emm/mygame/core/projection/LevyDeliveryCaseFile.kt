package com.emm.mygame.core.projection

import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.long

private val caseFields: Set<String> = setOf(
    "name",
    "startedAtEpochMilliseconds",
    "perUnitSeconds",
    "count",
    "atEpochMilliseconds",
    "expectedDelivered",
)

fun readLevyDeliveryCases(): List<LevyDeliveryCase> =
    readSharedCases(property = "levy.delivery.cases", fields = caseFields).map { case: JsonObject ->
        case.toLevyDeliveryCase()
    }

private fun JsonObject.toLevyDeliveryCase(): LevyDeliveryCase = LevyDeliveryCase(
    name = primitive("name").content,
    startedAt = Instant.fromEpochMilliseconds(primitive("startedAtEpochMilliseconds").long),
    perUnit = primitive("perUnitSeconds").long.seconds,
    count = primitive("count").int,
    at = Instant.fromEpochMilliseconds(primitive("atEpochMilliseconds").long),
    expectedDelivered = primitive("expectedDelivered").int,
)
