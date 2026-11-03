package com.emm.mygame

import com.emm.mygame.core.network.FiefId
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test

class DestinationTest {

    private val secondFief: FiefId = FiefId("7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17")

    @Test
    fun `keeps the fief id of every signed-in destination through a serializer round trip`() {
        val signedIn: List<Destination> = listOf(
            Destination.Fief(secondFief),
            Destination.Map(secondFief),
            Destination.Chronicle(secondFief),
        )

        val restored: List<Destination> = signedIn.map { destination: Destination ->
            Json.decodeFromString(Destination.serializer(), Json.encodeToString(Destination.serializer(), destination))
        }

        assertEquals(signedIn, restored)
    }
}
