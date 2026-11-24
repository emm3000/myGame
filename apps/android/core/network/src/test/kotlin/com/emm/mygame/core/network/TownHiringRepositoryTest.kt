package com.emm.mygame.core.network

import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringRefusal
import com.emm.mygame.core.model.town.hiring.TownHiringResult
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

    private companion object {
        const val ORDER_START: String = "2026-11-05T10:00:00.000Z"
    }
}
