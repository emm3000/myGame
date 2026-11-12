package com.emm.mygame.feature.map

import app.cash.turbine.test
import com.emm.mygame.core.network.JobQuoteResult
import com.emm.mygame.core.network.JobTarget
import com.emm.mygame.core.network.RegionMapResult
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownJobResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeRegionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class MapViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private fun TestScope.formFilled(
        town: TownSnapshot = townOf(),
        workers: String = "2",
        trucks: String = "1",
        hours: String = "3",
    ): MapViewModel {
        val viewModel: MapViewModel = mapReading(towns, town = town)
        viewModel.onIntent(MapIntent.SendTeamTapped(site = 1))
        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Workers, workers))
        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Trucks, trucks))
        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Hours, hours))
        return viewModel
    }

    private fun blockOf(viewModel: MapViewModel): MapUiState.JobBlock? = contentOf(viewModel).form?.block

    private fun quoteOf(viewModel: MapViewModel): MapUiState.PayQuote? = contentOf(viewModel).form?.quote

    private fun jobFor(hours: Int): FakeRegionRepository.JobRequest = FakeRegionRepository.JobRequest(
        target = JobTarget(area = 1, site = 1),
        team = mapOf(TownHireKind.Worker to 2, TownHireKind.Truck to 1),
        hours = hours,
    )

    private fun quotedPay(money: Long): JobQuoteResult.Quoted = JobQuoteResult.Quoted(
        mapOf(
            TownResourceKind.Money to money,
            TownResourceKind.Food to 0L,
            TownResourceKind.Power to 0L,
            TownResourceKind.Material to 30L,
        ),
    )

    private fun drawnPay(money: Long): MapUiState.PayQuote = MapUiState.PayQuote.Quoted(
        listOf(MapUiState.PayLine(TownResourceKind.Money, money), MapUiState.PayLine(TownResourceKind.Material, 30L)),
    )

    @Test
    fun `opens the map on the town's area`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, map = regionMapOf(area = 2, terrain = Terrain.Hills))

        assertEquals(listOf<Int?>(null), towns.regions.mapReads)
        assertEquals(MapUiState.AreaLine(area = 2, terrain = Terrain.Hills), contentOf(viewModel).areaLine)
    }

    @Test
    fun `draws loading until the town answers`() = runTest {
        towns.regions.answerMap(RegionMapResult.Read(regionMapOf()))
        val viewModel: MapViewModel = mapViewModelOf(towns)
        runCurrent()

        assertEquals(MapUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `leaves the map when the player holds no town`() = runTest {
        towns.answerRead(TownReadResult.NoTown)
        val viewModel: MapViewModel = mapViewModelOf(towns)

        viewModel.effects.test {
            assertEquals(MapEffect.NoTown, awaitItem())
        }
    }

    @Test
    fun `browses with previous and next`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, map = regionMapOf(area = 2, lastArea = 3))
        val middle: MapUiState.Content = contentOf(viewModel)
        towns.regions.answerMap(RegionMapResult.Read(regionMapOf(area = 3, lastArea = 3)))

        viewModel.onIntent(MapIntent.AreaTapped(area = 3))
        runCurrent()

        assertEquals(1 to 3, middle.previousArea to middle.nextArea)
        assertEquals(listOf(null, 3), towns.regions.mapReads)
        assertEquals(3, contentOf(viewModel).areaLine.area)
    }

    @Test
    fun `draws loading while another area is read`() = runTest {
        val viewModel: MapViewModel = mapReading(towns)

        viewModel.onIntent(MapIntent.AreaTapped(area = 2))
        runCurrent()

        assertEquals(MapUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `offers no previous area on the first area`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, map = regionMapOf(area = 1, lastArea = 3))

        assertNull(contentOf(viewModel).previousArea)
    }

    @Test
    fun `offers no next area on the last browsable area`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, map = regionMapOf(area = 3, lastArea = 3))

        assertNull(contentOf(viewModel).nextArea)
    }

    @Test
    fun `draws the area not found with a way back to the own area`() = runTest {
        val viewModel: MapViewModel = mapReading(towns)
        towns.regions.answerMap(RegionMapResult.AreaNotFound)
        viewModel.onIntent(MapIntent.AreaTapped(area = 2))
        runCurrent()
        val notFound: MapUiState = viewModel.state.value
        towns.regions.answerMap(RegionMapResult.Read(regionMapOf(area = 1)))

        viewModel.onIntent(MapIntent.OwnAreaTapped)
        runCurrent()

        assertEquals(MapUiState.AreaNotFound, notFound)
        assertEquals(listOf(null, 2, null), towns.regions.mapReads)
        assertEquals(1, contentOf(viewModel).areaLine.area)
    }

    @Test
    fun `draws a failed read with a retry that reads again`() = runTest {
        towns.answerRead(TownReadResult.Read(townOf()))
        towns.regions.answerMap(RegionMapResult.Unreachable)
        val viewModel: MapViewModel = mapViewModelOf(towns)
        runCurrent()
        val failed: MapUiState = viewModel.state.value
        towns.regions.answerMap(RegionMapResult.Read(regionMapOf()))

        viewModel.onIntent(MapIntent.RetryTapped)
        runCurrent()

        assertEquals(MapUiState.Failed, failed)
        assertEquals(listOf<Int?>(null, null), towns.regions.mapReads)
        assertEquals(1, contentOf(viewModel).areaLine.area)
    }

    @Test
    fun `opens the job form of a free site with a team of nobody for one hour`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, town = townOf(workers = 3, trucks = 1))

        viewModel.onIntent(MapIntent.SendTeamTapped(site = 1))

        assertEquals(
            MapUiState.JobForm(
                site = 1,
                workers = "0",
                trucks = "0",
                hours = "1",
                workersAtHome = 3,
                trucksAtHome = 1,
                block = MapUiState.JobBlock.InvalidTeam,
                quote = null,
            ),
            contentOf(viewModel).form,
        )
    }

    @Test
    fun `sends a job from a free site`() = runTest {
        val viewModel: MapViewModel = formFilled(workers = "2", trucks = "1", hours = "3")

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(
            listOf(
                FakeRegionRepository.JobRequest(
                    target = JobTarget(area = 1, site = 1),
                    team = mapOf(TownHireKind.Worker to 2, TownHireKind.Truck to 1),
                    hours = 3,
                ),
            ),
            towns.regions.jobSends,
        )
    }

    @Test
    fun `closes the form once the api takes the job`() = runTest {
        val viewModel: MapViewModel = formFilled()
        towns.regions.answerJob(TownJobResult.Answered(townOf(job = jobOf())))

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertNull(contentOf(viewModel).form)
    }

    @Test
    fun `sends one job on a double tap`() = runTest {
        val viewModel: MapViewModel = formFilled()

        viewModel.onIntent(MapIntent.SendTapped)
        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(1, towns.regions.jobSends.size)
    }

    @Test
    fun `blocks a team count that is not a whole count`() = runTest {
        val viewModel: MapViewModel = formFilled(workers = "1.5")

        assertEquals(MapUiState.JobBlock.CountNeeded, blockOf(viewModel))
    }

    @Test
    fun `sends nothing for a team count that is not a whole count`() = runTest {
        val viewModel: MapViewModel = formFilled(trucks = "-1")

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(emptyList<FakeRegionRepository.JobRequest>(), towns.regions.jobSends)
    }

    @Test
    fun `blocks a team with nobody in it`() = runTest {
        val viewModel: MapViewModel = formFilled(workers = "0", trucks = "0")

        assertEquals(MapUiState.JobBlock.InvalidTeam, blockOf(viewModel))
    }

    @Test
    fun `blocks hours that are not a whole count from 1`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "0")

        assertEquals(MapUiState.JobBlock.HoursNeeded, blockOf(viewModel))
    }

    @Test
    fun `leaves the send to the api while a team is out`() = runTest {
        val viewModel: MapViewModel = formFilled(town = townOf(job = jobOf()), workers = "1", trucks = "0")

        assertNull(blockOf(viewModel))
    }

    @Test
    fun `leaves the send to the api for a team larger than the one at home`() = runTest {
        val viewModel: MapViewModel = formFilled(town = townOf(workers = 3, trucks = 1), workers = "5", trucks = "2")

        assertNull(blockOf(viewModel))
    }

    @Test
    fun `sends a team larger than the one at home and draws the api's refusal under the form`() = runTest {
        val refusal: TownJobRefusal = TownJobRefusal.NotEnoughHiresAtHome(TownHireKind.Worker, count = 5, atHome = 3)
        val viewModel: MapViewModel = formFilled(town = townOf(workers = 3), workers = "5")
        towns.regions.answerJob(TownJobResult.Refused(refusal))

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(MapUiState.SendRequest.Refused(site = 1, refusal = refusal), contentOf(viewModel).send)
    }

    @Test
    fun `calls a job back once on a double tap`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, town = townOf(job = jobOf()))

        viewModel.onIntent(MapIntent.CallBackTapped)
        viewModel.onIntent(MapIntent.CallBackTapped)
        runCurrent()

        assertEquals(listOf(readInstant), towns.regions.callBacks)
    }

    @Test
    fun `shows a job coming back with its countdown and no call back`() = runTest {
        val returning: TownSnapshot.Job = jobOf(phase = TownSnapshot.JobPhase.Returning)
        val viewModel: MapViewModel = mapReading(towns, town = townOf(job = returning))

        assertEquals(
            MapUiState.JobOut(
                site = TownSite(region = 1, area = 1, site = 1),
                workers = 2,
                trucks = 1,
                phase = TownSnapshot.JobPhase.Returning,
                remaining = 140.minutes,
                finishesAt = returning.returnsAt,
                pay = listOf(
                    MapUiState.PayLine(TownResourceKind.Money, 120L),
                    MapUiState.PayLine(TownResourceKind.Material, 40L),
                ),
                canCallBack = false,
            ),
            contentOf(viewModel).jobOut,
        )
    }

    @Test
    fun `reads the town again when the job's next instant comes`() = runTest {
        mapReading(towns, town = townOf(job = jobOf(phase = TownSnapshot.JobPhase.Outbound)))
        towns.answerRead(TownReadResult.Read(townOf(job = jobOf(phase = TownSnapshot.JobPhase.Working))))

        advanceTimeBy(10.minutes + 1.seconds)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `reads the town again when the screen is shown again`() = runTest {
        val viewModel: MapViewModel = mapReading(towns)
        towns.answerRead(TownReadResult.Read(townOf()))

        viewModel.onIntent(MapIntent.ScreenHidden)
        viewModel.onIntent(MapIntent.ScreenShown)
        runCurrent()

        assertEquals(2, towns.readCount)
    }

    @Test
    fun `shows the pay before sending a job`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")

        towns.regions.answerQuote(jobFor(hours = 3), quotedPay(money = 90L))
        runCurrent()

        assertEquals(drawnPay(money = 90L), quoteOf(viewModel))
    }

    @Test
    fun `draws the quote as asked until the api answers`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")

        assertEquals(MapUiState.PayQuote.Asking, quoteOf(viewModel))
    }

    @Test
    fun `asks the quote again when the hours change`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")

        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Hours, "4"))

        assertEquals(listOf(jobFor(hours = 3), jobFor(hours = 4)), towns.regions.quotes.takeLast(2))
    }

    @Test
    fun `ignores a quote answered for an older form`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")
        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Hours, "4"))

        towns.regions.answerQuote(jobFor(hours = 4), quotedPay(money = 120L))
        towns.regions.answerQuote(jobFor(hours = 3), quotedPay(money = 90L))
        runCurrent()

        assertEquals(drawnPay(money = 120L), quoteOf(viewModel))
    }

    @Test
    fun `drops the pay of the last entries while the new ones are quoted`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")
        towns.regions.answerQuote(jobFor(hours = 3), quotedPay(money = 90L))
        runCurrent()

        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Hours, "4"))

        assertEquals(MapUiState.PayQuote.Asking, quoteOf(viewModel))
    }

    @Test
    fun `asks no quote while an entry is not a whole count`() = runTest {
        val viewModel: MapViewModel = mapReading(towns)
        viewModel.onIntent(MapIntent.SendTeamTapped(site = 1))
        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Workers, "1.5"))

        viewModel.onIntent(MapIntent.JobEntryChanged(MapIntent.JobField.Hours, "x"))

        assertEquals(emptyList<FakeRegionRepository.JobRequest>(), towns.regions.quotes)
        assertNull(quoteOf(viewModel))
    }

    @Test
    fun `asks no quote while the team is empty`() = runTest {
        val viewModel: MapViewModel = formFilled(workers = "0", trucks = "0", hours = "3")

        assertEquals(emptyList<FakeRegionRepository.JobRequest>(), towns.regions.quotes)
        assertNull(quoteOf(viewModel))
    }

    @Test
    fun `asks the quote of a team larger than the one at home`() = runTest {
        formFilled(town = townOf(workers = 3, trucks = 1), workers = "5", trucks = "1", hours = "3")

        assertEquals(
            FakeRegionRepository.JobRequest(
                target = JobTarget(area = 1, site = 1),
                team = mapOf(TownHireKind.Worker to 5, TownHireKind.Truck to 1),
                hours = 3,
            ),
            towns.regions.quotes.last(),
        )
    }

    @Test
    fun `asks the quote while a team is out`() = runTest {
        formFilled(town = townOf(job = jobOf()), hours = "3")

        assertEquals(jobFor(hours = 3), towns.regions.quotes.last())
    }

    @Test
    fun `draws the api's refusal of a quote`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")

        towns.regions.answerQuote(jobFor(hours = 3), JobQuoteResult.Refused(TownJobRefusal.SiteHeld))
        runCurrent()

        assertEquals(MapUiState.PayQuote.Refused(TownJobRefusal.SiteHeld), quoteOf(viewModel))
    }

    @Test
    fun `draws an unreachable quote`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")

        towns.regions.answerQuote(jobFor(hours = 3), JobQuoteResult.Unreachable)
        runCurrent()

        assertEquals(MapUiState.PayQuote.Unreachable, quoteOf(viewModel))
    }

    @Test
    fun `asks the quote again a moment after the server could not be reached`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")
        towns.regions.answerQuote(jobFor(hours = 3), JobQuoteResult.Unreachable)
        runCurrent()

        advanceTimeBy(5.seconds)
        runCurrent()
        towns.regions.answerQuote(jobFor(hours = 3), quotedPay(money = 90L))
        runCurrent()

        val asked: FakeRegionRepository.JobRequest = jobFor(hours = 3)
        assertEquals(2, towns.regions.quotes.count { request: FakeRegionRepository.JobRequest -> request == asked })
        assertEquals(drawnPay(money = 90L), quoteOf(viewModel))
    }

    @Test
    fun `sends a job whose quote could not be read`() = runTest {
        val viewModel: MapViewModel = formFilled(hours = "3")
        towns.regions.answerQuote(jobFor(hours = 3), JobQuoteResult.Unreachable)
        runCurrent()

        viewModel.onIntent(MapIntent.SendTapped)
        runCurrent()

        assertEquals(listOf(jobFor(hours = 3)), towns.regions.jobSends)
    }

    @Test
    fun `asks the quote again when the season turns`() = runTest {
        val turn: Instant = readInstant + 30.minutes
        formFilled(town = townOf(seasonEndsAt = turn), hours = "3")
        towns.regions.answerQuote(jobFor(hours = 3), quotedPay(money = 90L))
        runCurrent()
        towns.answerRead(TownReadResult.Read(townOf(seasonEndsAt = turn + 90.days, readAt = turn)))

        advanceTimeBy(30.minutes + 1.seconds)
        runCurrent()

        assertEquals(listOf(jobFor(hours = 3), jobFor(hours = 3)), towns.regions.quotes.takeLast(2))
    }
}
