package com.emm.mygame.core.network

import java.io.File
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.int
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Test

class ReviewAnswerMaxLengthTest {

    @Test
    fun `caps the answer at the length the api document declares`() {
        val document: JsonObject = Json.parseToJsonElement(File("../../../api/openapi.json").readText()).jsonObject
        val answer: JsonObject = document.member("components").member("schemas").member("ReviewAnswerRequest")
            .member("properties").member("answer")

        assertEquals(answer.getValue("maxLength").jsonPrimitive.int, REVIEW_ANSWER_MAX_LENGTH)
    }

    private fun JsonObject.member(name: String): JsonObject = getValue(name).jsonObject
}
