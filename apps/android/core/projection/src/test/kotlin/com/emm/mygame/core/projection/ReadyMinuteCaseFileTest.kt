package com.emm.mygame.core.projection

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertThrows
import org.junit.Test

class ReadyMinuteCaseFileTest {

    @Test
    fun `rejects an unknown field inside a needs entry`() {
        val caseWithUnknownNeedField: JsonObject = Json.parseToJsonElement(
            """{"name":"a case","readAtEpochMilliseconds":0,"expectedReadyEpochMilliseconds":null,""" +
                """"needs":[{"storedAmount":0,"ratePerHour":60,"capacity":900,"cost":10,"fullAt":null}]}""",
        ).jsonObject

        assertThrows(IllegalArgumentException::class.java) { caseWithUnknownNeedField.toReadyMinuteCase() }
    }
}
