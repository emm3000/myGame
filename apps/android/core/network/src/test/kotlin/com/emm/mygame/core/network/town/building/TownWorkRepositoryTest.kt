package com.emm.mygame.core.network.town.building

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.NeededWordKind
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkRefusal
import com.emm.mygame.core.model.town.building.TownWorkResult
import com.emm.mygame.core.network.takeRequestWithin
import com.emm.mygame.core.network.town.TownRepositoryFixture
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
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

    @Test
    fun `reads each place with its next level`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.Building(
                kind = TownBuildingKind.Homes,
                level = 1,
                next = TownSnapshot.NextLevel(
                    level = 2,
                    costs = listOf(
                        TownSnapshot.Cost(TownResourceKind.Money, 60),
                        TownSnapshot.Cost(TownResourceKind.Material, 30),
                    ),
                    duration = 90.seconds,
                    people = 3,
                    wordsNeeded = null,
                ),
            ),
            read.buildings.first(),
        )
    }

    @Test
    fun `reads a place at its top level with no next level`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TownSnapshot.Building(TownBuildingKind.Office, level = 10, next = null), read.buildings.last())
    }

    @Test
    fun `reads each place from its own key`() = runTest {
        val levels: String = TOWN
            .replace(""""farm":$FLAT""", """"farm":{"level":2,"nextLevel":null}""")
            .replace(""""factory":$FLAT""", """"factory":{"level":3,"nextLevel":null}""")
            .replace(""""powerStation":$FLAT""", """"powerStation":{"level":4,"nextLevel":null}""")
            .replace(""""storage":$FLAT""", """"storage":{"level":5,"nextLevel":null}""")
            .replace(""""school":$FLAT""", """"school":{"level":6,"nextLevel":null}""")
        api.enqueue(json(200, levels))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(
                TownBuildingKind.Homes to 1,
                TownBuildingKind.Farm to 2,
                TownBuildingKind.Factory to 3,
                TownBuildingKind.PowerStation to 4,
                TownBuildingKind.Storage to 5,
                TownBuildingKind.School to 6,
                TownBuildingKind.Office to 10,
            ),
            read.buildings.map { place: TownSnapshot.Building -> place.kind to place.level },
        )
    }

    @Test
    fun `reads the slot and the waiting list of the building work`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.Work(
                slot = TownSnapshot.WorkItem(
                    building = TownBuildingKind.Farm,
                    level = 2,
                    startsAt = Instant.parse("2026-11-05T10:00:00.000Z"),
                    finishesAt = Instant.parse("2026-11-05T10:10:00.000Z"),
                ),
                waitingList = listOf(
                    TownSnapshot.WorkItem(
                        building = TownBuildingKind.School,
                        level = 3,
                        startsAt = Instant.parse("2026-11-05T10:10:00.000Z"),
                        finishesAt = Instant.parse("2026-11-05T10:30:00.000Z"),
                    ),
                ),
                cap = 2,
            ),
            read.work,
        )
    }
}
