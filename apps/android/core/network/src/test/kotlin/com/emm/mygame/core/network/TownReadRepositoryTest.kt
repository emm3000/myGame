package com.emm.mygame.core.network

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.SeasonDurationPercent
import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.SeasonProductionPercent
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.model.town.hiring.TownHireKind
import kotlin.time.Duration.Companion.seconds
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
    fun `reads a caught up next step with no review ahead`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null), read.nextStep)
        assertEquals(null, read.nextDueAt)
    }

    @Test
    fun `reads the reviews step with its count and the lessons to read first`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"reviews","count":3,"readFirst":["lesson-2","lesson-3"]}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.Reviews(3, listOf(LessonId("lesson-2"), LessonId("lesson-3"))), read.nextStep)
    }

    @Test
    fun `reads the goal a running lesson carries`() = runTest {
        val goal: String = """{"position":1,"count":9,"building":"farm","level":1,"state":"underway"}"""
        api.enqueue(json(200, townWithNextStep("""{"kind":"lessonRunning","goal":$goal,"text":null}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        val underway: TownGoal = TownGoal(
            position = 1,
            count = 9,
            building = TownBuildingKind.Farm,
            level = 1,
            state = TownGoal.State.Underway,
        )
        assertEquals(NextStep.LessonRunning(underway, text = null), read.nextStep)
    }

    @Test
    fun `reads a running lesson that carries no goal`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"lessonRunning","goal":null,"text":null}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.LessonRunning(goal = null, text = null), read.nextStep)
    }

    @Test
    fun `reads the lesson to study`() = runTest {
        api.enqueue(json(200, townWithNextStep("""{"kind":"lessonToStudy","lessonId":"lesson-2"}""")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.LessonToStudy(LessonId("lesson-2")), read.nextStep)
    }

    @Test
    fun `reads the next review's instant`() = runTest {
        val dueLater: String = TOWN.replace(""""nextDueAt":null""", """"nextDueAt":"2026-11-05T10:09:00.000Z"""")
        api.enqueue(json(200, dueLater))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(Instant.parse("2026-11-05T10:09:00Z"), read.nextDueAt)
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

    private fun townWithNextStep(step: String): String =
        TOWN.replace("""{"kind":"caughtUp","reason":"lessonsDone","goal":null,"text":null}""", step)

    private companion object {
        val moneyFullAt: Instant = Instant.parse("2026-11-06T14:51:09Z")
        const val OPEN_ORDER: String =
            """"order":{"hire":"truck","count":3,"delivered":1,"secondsPerHire":180,""" +
                """"startedAt":"2026-11-05T10:00:00.000Z","endsAt":"2026-11-05T10:09:00.000Z"}"""
    }
}
