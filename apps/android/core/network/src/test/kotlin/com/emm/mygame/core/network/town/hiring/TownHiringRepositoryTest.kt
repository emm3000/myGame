package com.emm.mygame.core.network.town.hiring

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringRefusal
import com.emm.mygame.core.model.town.hiring.TownHiringResult
import com.emm.mygame.core.network.takeRequestWithin
import com.emm.mygame.core.network.town.TownRepositoryFixture
import kotlin.time.Instant
import kotlinx.coroutines.test.runTest
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownHiringRepositoryTest : TownRepositoryFixture() {

    @Test
    fun `places a hiring order by its kind and count`() = runTest {
        api.enqueue(json(200, TOWN))

        town().placeHiring(TownHireKind.Truck, count = 3)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/hiring", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"hire":"truck","count":3}""", request.body?.utf8())
    }

    @Test
    fun `stops a hiring order by its kind and start`() = runTest {
        api.enqueue(json(200, TOWN))

        town().stopHiring(TownHireKind.Worker, startedAt = Instant.parse("2026-11-05T10:00:00Z"))

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals(
            "DELETE /api/town/hiring/worker/2026-11-05T10:00:00.000Z",
            "${request.method} ${request.url.encodedPath}",
        )
    }

    @Test
    fun `reads an office too low refusal with its levels`() = runTest {
        api.enqueue(
            json(409, """{"kind":"OfficeTooLow","params":{"hire":"truck","requiredOfficeLevel":3,"officeLevel":1}}"""),
        )

        assertEquals(
            TownHiringResult.Refused(TownHiringRefusal.OfficeTooLow(officeLevel = 1, requiredOfficeLevel = 3)),
            town().placeHiring(TownHireKind.Truck, count = 1),
        )
    }

    @Test
    fun `reads a busy hiring slot refusal`() = runTest {
        api.enqueue(json(409, """{"kind":"HiringSlotBusy","params":{"hire":"worker"}}"""))

        assertEquals(
            TownHiringResult.Refused(TownHiringRefusal.HiringSlotBusy),
            town().placeHiring(TownHireKind.Worker, count = 1),
        )
    }

    @Test
    fun `reads a stale hiring order refusal`() = runTest {
        api.enqueue(
            json(409, """{"kind":"HiringOrderNotFound","params":{"hire":"worker","startedAt":"$ORDER_START"}}"""),
        )

        assertEquals(
            TownHiringResult.Refused(TownHiringRefusal.HiringOrderNotFound),
            town().stopHiring(TownHireKind.Worker, startedAt = Instant.parse(ORDER_START)),
        )
    }

    @Test
    fun `reads the hiring terms and the hires held per kind`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.Hiring(
                order = null,
                hires = mapOf(TownHireKind.Worker to 0, TownHireKind.Truck to 0),
                terms = mapOf(
                    TownHireKind.Worker to TownSnapshot.HireTerms(
                        costs = listOf(TownSnapshot.Cost(TownResourceKind.Money, 40)),
                        secondsPerHire = 60,
                        people = 1,
                        requiredOfficeLevel = 1,
                    ),
                    TownHireKind.Truck to TownSnapshot.HireTerms(
                        costs = listOf(
                            TownSnapshot.Cost(TownResourceKind.Money, 80),
                            TownSnapshot.Cost(TownResourceKind.Food, 40),
                            TownSnapshot.Cost(TownResourceKind.Power, 40),
                            TownSnapshot.Cost(TownResourceKind.Material, 60),
                        ),
                        secondsPerHire = 180,
                        people = 1,
                        requiredOfficeLevel = 3,
                    ),
                ),
            ),
            read.hiring,
        )
    }

    @Test
    fun `reads the open hiring order with its delivered count`() = runTest {
        api.enqueue(json(200, TOWN.replace(""""order":null""", OPEN_ORDER)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.HiringOrder(
                hire = TownHireKind.Truck,
                count = 3,
                delivered = 1,
                secondsPerHire = 180,
                startedAt = Instant.parse("2026-11-05T10:00:00.000Z"),
                endsAt = Instant.parse("2026-11-05T10:09:00.000Z"),
            ),
            read.hiring.order,
        )
    }

    private companion object {
        const val OPEN_ORDER: String =
            """"order":{"hire":"truck","count":3,"delivered":1,"secondsPerHire":180,""" +
                """"startedAt":"2026-11-05T10:00:00.000Z","endsAt":"2026-11-05T10:09:00.000Z"}"""
        const val ORDER_START: String = "2026-11-05T10:00:00.000Z"
    }
}
