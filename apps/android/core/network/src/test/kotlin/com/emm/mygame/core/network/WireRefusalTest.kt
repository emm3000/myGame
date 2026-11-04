package com.emm.mygame.core.network

import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Test

class WireRefusalTest {

    @Test
    fun `decodes with params exactly the kinds the api spec gives params`() {
        val spec: JsonObject = Json.parseToJsonElement(File(System.getProperty(API_SPEC_PROPERTY)).readText())
            .jsonObject
        val mapping: JsonObject = spec.getValue("components").jsonObject
            .getValue("schemas").jsonObject
            .getValue("ApiError").jsonObject
            .getValue("discriminator").jsonObject
            .getValue("mapping").jsonObject

        val specKindsWithParams: Set<String> = mapping
            .filterValues { schema -> schema.jsonPrimitive.content != BARE_API_ERROR_SCHEMA }
            .keys

        assertEquals(specKindsWithParams, kindsWithParams)
    }
}

private const val API_SPEC_PROPERTY: String = "mygame.apiSpec"

private const val BARE_API_ERROR_SCHEMA: String = "#/components/schemas/BareApiError"
