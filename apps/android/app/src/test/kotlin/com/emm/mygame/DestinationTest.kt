package com.emm.mygame

import com.emm.mygame.core.network.LessonId
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test

class DestinationTest {

    @Test
    fun `keeps every signed-in destination through a serializer round trip`() {
        val signedIn: List<Destination> = listOf(
            Destination.Town,
            Destination.School,
            Destination.Report,
            Destination.Map,
            Destination.Review,
            Destination.LessonWords(LessonId("lesson-2"), walked = listOf(LessonId("lesson-1"))),
        )

        val restored: List<Destination> = signedIn.map { destination: Destination ->
            Json.decodeFromString(Destination.serializer(), Json.encodeToString(Destination.serializer(), destination))
        }

        assertEquals(signedIn, restored)
    }
}
