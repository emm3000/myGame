package com.emm.mygame.core.projection

import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

fun readSharedCases(property: String, fields: Set<String>): List<JsonObject> {
    val path: String = requireNotNull(System.getProperty(property)) { "$property is not set" }
    val root: JsonObject = Json.parseToJsonElement(File(path).readText()).jsonObject
    val cases: JsonArray = root.getValue("cases").jsonArray
    require(cases.isNotEmpty()) { "the shared file $path holds no case" }
    return cases.map { case: JsonElement ->
        val fieldsOfCase: JsonObject = case.jsonObject
        require(fieldsOfCase.keys == fields) { "a case of $path holds ${fieldsOfCase.keys}, expected $fields" }
        fieldsOfCase
    }
}

fun JsonObject.primitive(field: String): JsonPrimitive = getValue(field).jsonPrimitive
