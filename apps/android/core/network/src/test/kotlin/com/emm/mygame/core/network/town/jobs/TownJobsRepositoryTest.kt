package com.emm.mygame.core.network.town.jobs

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.jobs.JobTarget
import com.emm.mygame.core.model.town.jobs.TownJobRefusal
import com.emm.mygame.core.model.town.jobs.TownJobResult
import com.emm.mygame.core.model.town.jobs.WasteSize
import com.emm.mygame.core.network.takeRequestWithin
import com.emm.mygame.core.network.town.TownRepositoryFixture
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant
import kotlinx.coroutines.test.runTest
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownJobsRepositoryTest : TownRepositoryFixture() {

    private val target: JobTarget = JobTarget(area = 3, site = 5)

    private val team: Map<TownHireKind, Int> = mapOf(TownHireKind.Worker to 2, TownHireKind.Truck to 1)

    @Test
    fun `reads the job out with its site, team, pay and instants`() = runTest {
        api.enqueue(json(200, TOWN_WITH_JOB))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.Job(
                site = TownSite(region = 1, area = 3, site = 5),
                team = team,
                task = TownSnapshot.JobTask.Hours(hours = 2),
                pay = mapOf(
                    TownResourceKind.Money to 120L,
                    TownResourceKind.Food to 0L,
                    TownResourceKind.Power to 0L,
                    TownResourceKind.Material to 40L,
                ),
                phase = TownSnapshot.JobPhase.Working,
                sentAt = Instant.parse(SENT_AT),
                arrivesAt = Instant.parse("2026-11-05T10:10:00Z"),
                leavesAt = Instant.parse("2026-11-05T12:10:00Z"),
                returnsAt = Instant.parse("2026-11-05T12:20:00Z"),
                calledBackAt = null,
            ),
            read.job,
        )
    }

    @Test
    fun `reads a clean-up out with the size and the waste fixed at dispatch`() = runTest {
        api.enqueue(json(200, TOWN_WITH_CLEAN_UP))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(
            TownSnapshot.Job(
                site = TownSite(region = 1, area = 1, site = 12),
                team = mapOf(TownHireKind.Worker to 6, TownHireKind.Truck to 0),
                task = TownSnapshot.JobTask.CleanUp(size = WasteSize.Small, waste = 6),
                pay = mapOf(
                    TownResourceKind.Money to 12L,
                    TownResourceKind.Food to 0L,
                    TownResourceKind.Power to 0L,
                    TownResourceKind.Material to 18L,
                ),
                phase = TownSnapshot.JobPhase.Outbound,
                sentAt = Instant.parse(SENT_AT),
                arrivesAt = Instant.parse("2026-11-05T10:11:00Z"),
                leavesAt = Instant.parse("2026-11-05T10:11:00Z"),
                returnsAt = Instant.parse("2026-11-05T10:22:00Z"),
                calledBackAt = null,
            ),
            read.job,
        )
    }

    @Test
    fun `answers unreachable for a clean-up size the client does not know`() = runTest {
        api.enqueue(json(200, TOWN_WITH_CLEAN_UP.replace(""""size":1""", """"size":4""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `reads no job while the team is home`() = runTest {
        api.enqueue(json(200, TOWN))

        assertEquals(null, (town().read() as TownReadResult.Read).town.job)
    }

    @Test
    fun `reads each phase from its own key`() = runTest {
        val phases: Map<String, TownSnapshot.JobPhase> = mapOf(
            "outbound" to TownSnapshot.JobPhase.Outbound,
            "working" to TownSnapshot.JobPhase.Working,
            "returning" to TownSnapshot.JobPhase.Returning,
        )
        val towns: TownRepository = town()

        phases.forEach { (wire: String, phase: TownSnapshot.JobPhase) ->
            api.enqueue(json(200, TOWN_WITH_JOB.replace(""""phase":"working"""", """"phase":"$wire"""")))

            assertEquals(phase, (towns.read() as TownReadResult.Read).town.job?.phase)
        }
    }

    @Test
    fun `answers unreachable for a job phase the client does not know`() = runTest {
        api.enqueue(json(200, TOWN_WITH_JOB.replace(""""phase":"working"""", """"phase":"lost"""")))

        assertEquals(TownReadResult.Unreachable, town().read())
    }

    @Test
    fun `reads the instant a job was called back`() = runTest {
        val calledBack: String =
            TOWN_WITH_JOB.replace(""""calledBackAt":null""", """"calledBackAt":"2026-11-05T10:30:00.000Z"""")
        api.enqueue(json(200, calledBack))

        val read: TownSnapshot = (town().read() as TownReadResult.Read).town

        assertEquals(Instant.parse("2026-11-05T10:30:00Z"), read.job?.calledBackAt)
    }

    @Test
    fun `sends a job with its site, team and hours`() = runTest {
        api.enqueue(json(200, TOWN_WITH_JOB))

        town().sendJob(target, team, hours = 2)

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals("POST /api/town/jobs", "${request.method} ${request.url.encodedPath}")
        assertEquals("""{"site":{"area":3,"site":5},"team":{"worker":2,"truck":1},"hours":2}""", request.body?.utf8())
    }

    @Test
    fun `sends a hire kind the team leaves out as none`() = runTest {
        api.enqueue(json(200, TOWN_WITH_JOB))

        town().sendJob(target, mapOf(TownHireKind.Worker to 3), hours = 1)

        assertEquals(
            """{"site":{"area":3,"site":5},"team":{"worker":3,"truck":0},"hours":1}""",
            api.takeRequestWithin().body?.utf8(),
        )
    }

    @Test
    fun `answers and holds the town a sent job returns`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN_WITH_JOB))

        val answer: TownJobResult = towns.sendJob(target, team, hours = 2)

        val answered: TownSnapshot = (answer as TownJobResult.Answered).town
        assertEquals(TownSnapshot.JobPhase.Working, answered.job?.phase)
        assertEquals(answered, towns.town.value?.town)
    }

    @Test
    fun `keeps the last read's gap through a job answer`() = runTest {
        val towns: TownRepository = town()
        api.enqueue(json(200, TOWN))
        api.enqueue(json(200, TOWN_WITH_JOB))
        towns.read()
        testScheduler.advanceTimeBy(30.minutes)

        towns.callJobBack(Instant.parse(SENT_AT))

        assertEquals(1.minutes, towns.town.value?.gap)
    }

    @Test
    fun `calls a job back by the instant it was sent`() = runTest {
        api.enqueue(json(200, TOWN_WITH_JOB))

        town().callJobBack(Instant.parse("2026-11-05T10:00:00Z"))

        val request: RecordedRequest = api.takeRequestWithin()
        assertEquals(
            "POST /api/town/jobs/2026-11-05T10:00:00.000Z/call-back",
            "${request.method} ${request.url.encodedPath}",
        )
    }

    @Test
    fun `reads each refusal with no params`() = runTest {
        val refusals: Map<String, TownJobRefusal> = mapOf(
            "InvalidTeam" to TownJobRefusal.InvalidTeam,
            "JobSiteOutOfBounds" to TownJobRefusal.JobSiteOutOfBounds,
            "TeamAlreadyOut" to TownJobRefusal.TeamAlreadyOut,
            "JobToOwnSite" to TownJobRefusal.JobToOwnSite,
            "SiteHeld" to TownJobRefusal.SiteHeld,
            "JobNotFound" to TownJobRefusal.JobNotFound,
            "JobAlreadyReturning" to TownJobRefusal.JobAlreadyReturning,
            "TownNotFound" to TownJobRefusal.TownNotFound,
            "BlankTownName" to TownJobRefusal.Unrecognized,
            "QueueFull" to TownJobRefusal.Unrecognized,
        )
        val towns: TownRepository = town()

        refusals.forEach { (kind: String, refusal: TownJobRefusal) ->
            api.enqueue(json(409, """{"kind":"$kind"}"""))

            assertEquals(TownJobResult.Refused(refusal), towns.callJobBack(Instant.parse(SENT_AT)))
        }
    }

    @Test
    fun `carries the hours asked and the most a job may last`() = runTest {
        api.enqueue(json(400, """{"kind":"JobHoursOutOfRange","params":{"hours":9,"maxHours":8}}"""))

        assertEquals(
            TownJobResult.Refused(TownJobRefusal.JobHoursOutOfRange(hours = 9, maxHours = 8)),
            town().sendJob(target, team, hours = 9),
        )
    }

    @Test
    fun `carries the hires a team asks for and the hires at home`() = runTest {
        api.enqueue(json(409, """{"kind":"NotEnoughHiresAtHome","params":{"hire":"truck","count":1,"atHome":0}}"""))

        assertEquals(
            TownJobResult.Refused(TownJobRefusal.NotEnoughHiresAtHome(TownHireKind.Truck, count = 1, atHome = 0)),
            town().sendJob(target, team, hours = 2),
        )
    }

    @Test
    fun `answers unrecognized for a shortfall of a hire the client does not know`() = runTest {
        api.enqueue(json(409, """{"kind":"NotEnoughHiresAtHome","params":{"hire":"crane","count":1,"atHome":0}}"""))

        assertEquals(TownJobResult.Refused(TownJobRefusal.Unrecognized), town().sendJob(target, team, hours = 2))
    }

    @Test
    fun `answers unreachable when a job gets an empty refusal`() = runTest {
        api.enqueue(MockResponse.Builder().code(400).build())

        assertEquals(TownJobResult.Unreachable, town().callJobBack(Instant.parse(SENT_AT)))
    }

    @Test
    fun `answers unreachable when a job cannot reach the api`() = runTest {
        api.close()

        assertEquals(TownJobResult.Unreachable, town().sendJob(target, team, hours = 2))
    }

    private companion object {
        const val SENT_AT: String = "2026-11-05T10:00:00.000Z"
        const val JOB: String =
            """{"kind":"job","site":{"region":1,"area":3,"site":5},"team":{"worker":2,"truck":1},"hours":2,""" +
                """"pay":{"money":120,"food":0,"power":0,"material":40},"phase":"working",""" +
                """"sentAt":"$SENT_AT","arrivesAt":"2026-11-05T10:10:00.000Z",""" +
                """"leavesAt":"2026-11-05T12:10:00.000Z","returnsAt":"2026-11-05T12:20:00.000Z",""" +
                """"calledBackAt":null}"""
        val TOWN_WITH_JOB: String = TOWN.replace(""""job":null""", """"job":$JOB""")
        const val CLEAN_UP: String =
            """{"kind":"cleanUp","site":{"region":1,"area":1,"site":12},"team":{"worker":6,"truck":0},""" +
                """"size":1,"waste":6,"pay":{"money":12,"food":0,"power":0,"material":18},"phase":"outbound",""" +
                """"sentAt":"$SENT_AT","arrivesAt":"2026-11-05T10:11:00.000Z",""" +
                """"leavesAt":"2026-11-05T10:11:00.000Z","returnsAt":"2026-11-05T10:22:00.000Z",""" +
                """"calledBackAt":null}"""
        val TOWN_WITH_CLEAN_UP: String = TOWN.replace(""""job":null""", """"job":$CLEAN_UP""")
    }
}
