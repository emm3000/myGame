package com.emm.mygame.core.network.town.guidance

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.TipKind
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.model.town.guidance.TownGuidanceResult
import com.emm.mygame.core.network.takeRequestWithin
import com.emm.mygame.core.network.town.TownRepositoryFixture
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownGuidanceRepositoryTest : TownRepositoryFixture() {

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
    fun `reads a caught up step with no goal left`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(NextStep.CaughtUp(CaughtUpReason.LessonsDone, goal = null, text = null), read.nextStep)
    }

    @Test
    fun `reads a pending goal with the resources and the people it misses`() = runTest {
        api.enqueue(json(200, townWithGoal(PENDING_GOAL)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        val expected = TownGoal(
            position = 2,
            count = 9,
            building = TownBuildingKind.Factory,
            level = 1,
            state = TownGoal.State.Pending(
                resources = listOf(
                    TownSnapshot.Cost(TownResourceKind.Money, 40),
                    TownSnapshot.Cost(TownResourceKind.Material, 15),
                ),
                people = 3,
            ),
        )
        assertEquals(NextStep.CaughtUp(CaughtUpReason.LessonsDone, expected, text = null), read.nextStep)
    }

    @Test
    fun `reads a goal underway`() = runTest {
        api.enqueue(json(200, townWithGoal(UNDERWAY_GOAL)))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        val expected = TownGoal(
            position = 1,
            count = 9,
            building = TownBuildingKind.PowerStation,
            level = 1,
            state = TownGoal.State.Underway,
        )
        assertEquals(NextStep.CaughtUp(CaughtUpReason.LessonsDone, expected, text = null), read.nextStep)
    }

    @Test
    fun `answers unreachable for a goal on a place the client does not know`() = runTest {
        api.enqueue(json(200, townWithGoal(UNDERWAY_GOAL.replace("powerStation", "harbor"))))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `reads no tip when the api names none`() = runTest {
        api.enqueue(json(200, TOWN))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(null, read.tip)
    }

    @Test
    fun `reads the tip to show`() = runTest {
        api.enqueue(json(200, townWithTip("waitingList")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(TipKind.WaitingList, read.tip)
    }

    @Test
    fun `reads no tip for a tip the client does not know`() = runTest {
        api.enqueue(json(200, townWithTip("harbor")))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(null, read.tip)
    }

    @Test
    fun `marks a tip seen by its name on the wire`() = runTest {
        val wireNames: Map<TipKind, String> = mapOf(
            TipKind.People to "people",
            TipKind.Seasons to "seasons",
            TipKind.WaitingList to "waitingList",
            TipKind.Office to "office",
            TipKind.Jobs to "jobs",
            TipKind.FullStore to "fullStore",
        )
        val repository: TownRepository = town()

        val paths: List<String?> = TipKind.entries.map { tip: TipKind ->
            api.enqueue(MockResponse.Builder().code(204).build())
            repository.markTipSeen(tip)
            val request: RecordedRequest = api.takeRequestWithin()
            "${request.method} ${request.url.encodedPath}"
        }

        val expected: List<String> = TipKind.entries.map { tip: TipKind ->
            "POST /api/town/tips/${wireNames.getValue(tip)}"
        }
        assertEquals(expected, paths)
    }

    @Test
    fun `answers marked when the api marks the tip seen`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        assertEquals(TownGuidanceResult.Marked, town().markTipSeen(TipKind.Office))
    }

    @Test
    fun `answers unreachable when the api refuses the tip`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        assertEquals(TownGuidanceResult.Unreachable, town().markTipSeen(TipKind.Office))
    }

    @Test
    fun `dismisses the guidance`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        town().dismissGuidance()

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/guidance/dismissal", "${request.method} ${request.url.encodedPath}")
    }

    @Test
    fun `answers marked when the api dismisses the guidance`() = runTest {
        api.enqueue(MockResponse.Builder().code(204).build())

        assertEquals(TownGuidanceResult.Marked, town().dismissGuidance())
    }

    @Test
    fun `answers unreachable when the guidance finds no town`() = runTest {
        api.enqueue(json(404, """{"kind":"TownNotFound"}"""))

        assertEquals(TownGuidanceResult.Unreachable, town().dismissGuidance())
    }

    private fun townWithGoal(goal: String): String = TOWN.replace(""""goal":null""", """"goal":$goal""")

    private fun townWithTip(tip: String): String = TOWN.replace(""""tip":null""", """"tip":"$tip"""")

    private companion object {
        const val PENDING_GOAL: String =
            """{"position":2,"count":9,"building":"factory","level":1,"state":"pending",""" +
                """"missing":{"resources":{"money":40,"food":0,"power":0,"material":15},"people":3}}"""
        const val UNDERWAY_GOAL: String =
            """{"position":1,"count":9,"building":"powerStation","level":1,"state":"underway"}"""
    }
}
