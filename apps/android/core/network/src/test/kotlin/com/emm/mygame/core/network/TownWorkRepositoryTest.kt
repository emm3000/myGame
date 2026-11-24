package com.emm.mygame.core.network

import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.model.town.building.TownWorkResult
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownWorkRepositoryTest : TownRepositoryFixture() {

    private val wireNames: Map<TownBuildingKind, String> = mapOf(
        TownBuildingKind.Homes to "homes",
        TownBuildingKind.Farm to "farm",
        TownBuildingKind.Factory to "factory",
        TownBuildingKind.PowerStation to "powerStation",
        TownBuildingKind.Storage to "storage",
        TownBuildingKind.School to "school",
        TownBuildingKind.Office to "office",
    )

    @Test
    fun `starts work by naming only the place`() = runTest {
        api.enqueue(json(200, TOWN))

        town().startWork(TownBuildingKind.PowerStation)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/work", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"building":"powerStation"}""", request.body?.utf8())
    }

    @Test
    fun `stops work by its place and level`() = runTest {
        api.enqueue(json(200, TOWN))

        town().stopWork(TownBuildingKind.PowerStation, level = 3)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("DELETE /api/town/work/powerStation/3", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `names each place on the wire when it starts work`() = runTest {
        wireNames.forEach { (kind: TownBuildingKind, wire: String) ->
            api.enqueue(json(200, TOWN))

            town().startWork(kind)

            assertEquals("""{"building":"$wire"}""", api.takeRequestWithin().body?.utf8())
        }
    }

    @Test
    fun `names each place on the wire when it stops work`() = runTest {
        wireNames.forEach { (kind: TownBuildingKind, wire: String) ->
            api.enqueue(json(200, TOWN))

            town().stopWork(kind, level = 3)

            assertEquals("/api/town/work/$wire/3", api.takeRequestWithin().url.encodedPath)
        }
    }

    @Test
    fun `carries the cap of a full waiting list`() = runTest {
        api.enqueue(json(409, """{"kind":"WaitingListFull","params":{"cap":2}}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.WaitingListFull(cap = 2)),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `carries the words a level needs, the words held and their standing`() = runTest {
        api.enqueue(json(409, """{"kind":"NotEnoughWords","params":{"needed":50,"held":49,"standing":"retained"}}"""))

        assertEquals(
            TownWorkResult.Refused(
                TownWorkRefusal.NotEnoughWords(needed = 50, held = 49, standing = NeededWordKind.Retained),
            ),
            town().startWork(TownBuildingKind.Homes),
        )
    }

    @Test
    fun `carries the people a work needs and the people free`() = runTest {
        api.enqueue(json(409, """{"kind":"NotEnoughPeople","params":{"requiredPeople":5,"freePeople":2}}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.NotEnoughPeople(required = 5, free = 2)),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `reads a shortfall refusal`() = runTest {
        api.enqueue(
            json(
                409,
                """{"kind":"NotEnoughResources","params":{"missing":{"money":1,"food":0,"power":0,"material":0}}}""",
            ),
        )

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.NotEnoughResources),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `carries the level of a place at its top`() = runTest {
        api.enqueue(json(409, """{"kind":"TopLevelReached","params":{"building":"farm","level":10}}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.TopLevelReached(level = 10)),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `carries the level of a work no longer on the list`() = runTest {
        api.enqueue(json(409, """{"kind":"BuildingWorkNotFound","params":{"building":"farm","level":4}}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.BuildingWorkNotFound(level = 4)),
            town().stopWork(TownBuildingKind.Farm, level = 4),
        )
    }

    @Test
    fun `reads the refusal of work for a player with no town`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.TownNotFound),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `answers an unknown refusal as unrecognized`() = runTest {
        api.enqueue(json(409, """{"kind":"QueueFull"}"""))

        assertEquals(
            TownWorkResult.Refused(TownWorkRefusal.Unrecognized),
            town().startWork(TownBuildingKind.Farm),
        )
    }

    @Test
    fun `answers unreachable when work gets an empty refusal`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        assertEquals(TownWorkResult.Unreachable, town().stopWork(TownBuildingKind.Farm, level = 2))
    }
}
