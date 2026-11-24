package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.town.TownFoundRefusal
import com.emm.mygame.core.model.town.TownFoundResult
import com.emm.mygame.core.network.takeRequestWithin
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownFoundingRepositoryTest : TownRepositoryFixture() {

    @Test
    fun `founds the town with the name the player wrote`() = runTest {
        api.enqueue(json(200, TOWN))

        town().found("  Riverton ")

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"name":"  Riverton "}""", request.body?.utf8())
    }

    @Test
    fun `answers the founded town`() = runTest {
        api.enqueue(json(200, TOWN))

        assertEquals("Riverton", (town().found("Riverton") as TownFoundResult.Founded).town.name)
    }

    @Test
    fun `hands a blank name refusal to the caller`() = runTest {
        api.enqueue(json(400, """{"kind":"BlankTownName"}"""))

        assertEquals(TownFoundResult.Refused(TownFoundRefusal.BlankTownName), town().found(" "))
    }

    @Test
    fun `hands the refusal of a second town to the caller`() = runTest {
        api.enqueue(json(409, """{"kind":"PlayerAlreadyHoldsTown"}"""))

        assertEquals(TownFoundResult.Refused(TownFoundRefusal.PlayerAlreadyHoldsTown), town().found("Riverton"))
    }

    @Test
    fun `answers unreachable when a founding loses its site`() = runTest {
        api.enqueue(MockResponse.Builder().code(409).build())

        assertEquals(TownFoundResult.Unreachable, town().found("Riverton"))
    }
}
