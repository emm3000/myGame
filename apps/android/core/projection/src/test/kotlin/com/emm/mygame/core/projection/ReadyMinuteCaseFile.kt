package com.emm.mygame.core.projection

import kotlin.time.Instant
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.double
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.long

private val caseFields: Set<String> = setOf(
    "name",
    "needs",
    "readAtEpochMilliseconds",
    "expectedReadyEpochMilliseconds",
)

private val needFields: Set<String> = setOf("storedAmount", "ratePerHour", "capacity", "cost")

fun readReadyMinuteCases(): List<ReadyMinuteCase> =
    readSharedCases(property = "projection.cases", fields = caseFields, section = "readyMinuteCases")
        .map { case: JsonObject -> case.toReadyMinuteCase() }

internal fun JsonObject.toReadyMinuteCase(): ReadyMinuteCase = ReadyMinuteCase(
    name = primitive("name").content,
    needs = getValue("needs").jsonArray.map { need: JsonElement -> need.jsonObject.toResourceNeed() },
    readAt = Instant.fromEpochMilliseconds(primitive("readAtEpochMilliseconds").long),
    expectedReady = getValue("expectedReadyEpochMilliseconds").takeUnless { ready: JsonElement -> ready is JsonNull }
        ?.let { ready: JsonElement -> Instant.fromEpochMilliseconds(ready.jsonPrimitive.long) },
)

private fun JsonObject.toResourceNeed(): ResourceNeed {
    require(keys == needFields) { "a need holds $keys, expected $needFields" }
    return ResourceNeed(
        stock = ResourceStock(
            amount = primitive("storedAmount").long,
            ratePerHour = primitive("ratePerHour").double,
            capacity = primitive("capacity").long,
        ),
        cost = primitive("cost").long,
    )
}
