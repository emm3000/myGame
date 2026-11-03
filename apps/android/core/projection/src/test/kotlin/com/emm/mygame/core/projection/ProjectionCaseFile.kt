package com.emm.mygame.core.projection

import kotlin.time.Instant
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.double
import kotlinx.serialization.json.long

private val caseFields: Set<String> = setOf(
    "name",
    "storedAmount",
    "ratePerHour",
    "capacity",
    "readAtEpochMilliseconds",
    "nowEpochMilliseconds",
    "expectedAmount",
)

fun readProjectionCases(): List<ProjectionCase> =
    readSharedCases(property = "projection.cases", fields = caseFields).map { case: JsonObject ->
        case.toProjectionCase()
    }

private fun JsonObject.toProjectionCase(): ProjectionCase = ProjectionCase(
    name = primitive("name").content,
    stock = ResourceStock(
        amount = primitive("storedAmount").long,
        ratePerHour = primitive("ratePerHour").double,
        capacity = primitive("capacity").long,
    ),
    readAt = Instant.fromEpochMilliseconds(primitive("readAtEpochMilliseconds").long),
    now = Instant.fromEpochMilliseconds(primitive("nowEpochMilliseconds").long),
    expectedAmount = primitive("expectedAmount").long,
)
