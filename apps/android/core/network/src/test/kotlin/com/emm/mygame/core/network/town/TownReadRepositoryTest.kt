package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.town.SeasonDurationPercent
import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.SeasonProductionPercent
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Instant
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import org.junit.Assert.assertEquals
import org.junit.Test

class TownReadRepositoryTest : TownRepositoryFixture() {

    @Test
    fun `reads the town with its stocks in the catalog order`() = runTest {
        api.enqueue(json(200, TOWN))

        val answer: TownReadResult = town().read()

        val read: TownSnapshot = (answer as TownReadResult.Read).town
        assertEquals(
            listOf(
                TownSnapshot.Stock(
                    TownResourceKind.Money,
                    amount = 120,
                    ratePerHour = 30.5,
                    capacity = 1000,
                    fullAt = moneyFullAt,
                ),
                TownSnapshot.Stock(
                    TownResourceKind.Food,
                    amount = 80,
                    ratePerHour = 12.0,
                    capacity = 1000,
                    fullAt = null,
                ),
                TownSnapshot.Stock(
                    TownResourceKind.Power,
                    amount = 60,
                    ratePerHour = 0.0,
                    capacity = 1000,
                    fullAt = null,
                ),
                TownSnapshot.Stock(
                    TownResourceKind.Material,
                    amount = 40,
                    ratePerHour = 7.0,
                    capacity = 1000,
                    fullAt = null,
                ),
            ),
            read.stocks,
        )
    }

    @Test
    fun `maps a store's fill instant`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(moneyFullAt, null, null, null),
            read.stocks.map { stock: TownSnapshot.Stock -> stock.fullAt },
        )
    }

    @Test
    fun `reads the next review's instant`() = runTest {
        val dueLater: String = TOWN.replace(""""nextDueAt":null""", """"nextDueAt":"2026-11-05T10:09:00.000Z"""")
        api.enqueue(json(200, dueLater))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(Instant.parse("2026-11-05T10:09:00Z"), read.nextDueAt)
    }

    @Test
    fun `reads the season in force`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            SeasonInForce(
                SeasonKind.Fall,
                year = 1,
                productionPercent = SeasonProductionPercent(money = 100, food = 100, power = 100, material = 100),
                durationPercent = SeasonDurationPercent(build = 100, study = 100, hire = 100, road = 75),
            ),
            read.seasonInForce,
        )
    }

    @Test
    fun `reads each percent the season sets as the api sends it`() = runTest {
        val unscaled: String = """{"money":100,"food":100,"power":100,"material":100}"""
        val scaled: String = """{"money":90,"food":125,"power":75,"material":110}"""
        val shortened: String = """{"build":75,"study":80,"hire":120,"road":95}"""
        val shipped: String = """{"build":100,"study":100,"hire":100,"road":75}"""
        api.enqueue(json(200, TOWN.replace(unscaled, scaled).replace(shipped, shortened)))

        val season: SeasonInForce? = (town().read() as TownReadResult.Read).town.seasonInForce

        assertEquals(
            SeasonProductionPercent(money = 90, food = 125, power = 75, material = 110),
            season?.productionPercent,
        )
        assertEquals(SeasonDurationPercent(build = 75, study = 80, hire = 120, road = 95), season?.durationPercent)
    }

    @Test
    fun `reads the instants that change the town on their own`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            listOf(Instant.parse("2026-11-08T00:00:00.000Z"), Instant.parse("2026-11-05T10:20:00.000Z")),
            listOf(read.seasonEndsAt, read.lessonSlot?.finishesAt),
        )
    }

    @Test
    fun `answers no town when the api finds none`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(TownReadResult.NoTown, town().read())
    }

    @Test
    fun `answers unreachable when a read fails`() = runTest {
        api.enqueue(MockResponse.Builder().code(500).build())

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    private companion object {
        val moneyFullAt: Instant = Instant.parse("2026-11-06T14:51:09Z")
    }
}
