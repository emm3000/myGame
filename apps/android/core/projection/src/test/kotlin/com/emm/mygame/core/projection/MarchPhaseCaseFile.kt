package com.emm.mygame.core.projection

import kotlin.time.Duration
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.Instant
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.long

private val caseFields: Set<String> = setOf(
    "name",
    "departedAtEpochMilliseconds",
    "oneWaySeconds",
    "stayHours",
    "arrivesAtEpochMilliseconds",
    "leavesAtEpochMilliseconds",
    "atEpochMilliseconds",
    "expectedPhase",
    "expectedNextTurnInMilliseconds",
)

fun readMarchPhaseCases(): List<MarchPhaseCase> =
    readSharedCases(property = "march.phase.cases", fields = caseFields).map { case: JsonObject ->
        case.toMarchPhaseCase()
    }

private fun JsonObject.toMarchPhaseCase(): MarchPhaseCase = MarchPhaseCase(
    name = primitive("name").content,
    arrivesAt = Instant.fromEpochMilliseconds(primitive("arrivesAtEpochMilliseconds").long),
    leavesAt = Instant.fromEpochMilliseconds(primitive("leavesAtEpochMilliseconds").long),
    at = Instant.fromEpochMilliseconds(primitive("atEpochMilliseconds").long),
    expectedPhase = phaseNamed(primitive("expectedPhase").content),
    expectedNextTurn = expectedNextTurn(),
)

private fun phaseNamed(name: String): MarchPhase =
    MarchPhase.entries.single { phase: MarchPhase -> phase.name.equals(name, ignoreCase = true) }

private fun JsonObject.expectedNextTurn(): Duration? {
    val nextTurn: JsonPrimitive = primitive("expectedNextTurnInMilliseconds")
    if (nextTurn is JsonNull) {
        return null
    }
    return nextTurn.long.milliseconds
}
