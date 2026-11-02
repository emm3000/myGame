package com.emm.mygame.core.projection

import java.io.File
import kotlin.time.Instant
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
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

fun readProjectionCases(): List<ProjectionCase> {
    val path: String = requireNotNull(System.getProperty("projection.cases")) { "projection.cases is not set" }
    val root: JsonObject = Json.parseToJsonElement(File(path).readText()).jsonObject
    val cases: JsonArray = root.getValue("cases").jsonArray
    require(cases.isNotEmpty()) { "the shared projection file holds no case" }
    return cases.map { case: JsonElement -> case.jsonObject.toProjectionCase() }
}

private fun JsonObject.toProjectionCase(): ProjectionCase {
    require(keys == caseFields) { "a projection case holds $keys, expected $caseFields" }
    return ProjectionCase(
        name = getValue("name").jsonPrimitive.content,
        stock = ResourceStock(
            amount = number("storedAmount").long,
            ratePerHour = number("ratePerHour").double,
            capacity = number("capacity").long,
        ),
        readAt = Instant.fromEpochMilliseconds(number("readAtEpochMilliseconds").long),
        now = Instant.fromEpochMilliseconds(number("nowEpochMilliseconds").long),
        expectedAmount = number("expectedAmount").long,
    )
}

private fun JsonObject.number(field: String): JsonPrimitive = getValue(field).jsonPrimitive
