package com.emm.mygame.feature.map

import app.cash.turbine.test
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
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
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

    @Test
    fun `opens the map on the town's area`() = runTest {
        val viewModel: MapViewModel = mapReading(towns, map = regionMapOf(area = 2, terrain = Terrain.Hills))

        assertEquals(listOf<Int?>(null), towns.mapReads)
        assertEquals(MapUiState.AreaLine(area = 2, terrain = Terrain.Hills), contentOf(viewModel).areaLine)
    }

    @Test
    fun `draws loading until the town answers`() = runTest {
        towns.answerMap(RegionMapResult.Read(regionMapOf()))
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
        towns.answerMap(RegionMapResult.Read(regionMapOf(area = 3, lastArea = 3)))

        viewModel.onIntent(MapIntent.AreaTapped(area = 3))
        runCurrent()

        assertEquals(1 to 3, middle.previousArea to middle.nextArea)
        assertEquals(listOf(null, 3), towns.mapReads)
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
        towns.answerMap(RegionMapResult.AreaNotFound)
        viewModel.onIntent(MapIntent.AreaTapped(area = 2))
        runCurrent()
        val notFound: MapUiState = viewModel.state.value
        towns.answerMap(RegionMapResult.Read(regionMapOf(area = 1)))

        viewModel.onIntent(MapIntent.OwnAreaTapped)
        runCurrent()

        assertEquals(MapUiState.AreaNotFound, notFound)
        assertEquals(listOf(null, 2, null), towns.mapReads)
        assertEquals(1, contentOf(viewModel).areaLine.area)
    }

    @Test
    fun `draws a failed read with a retry that reads again`() = runTest {
        towns.answerRead(TownReadResult.Read(townOf()))
        towns.answerMap(RegionMapResult.Unreachable)
        val viewModel: MapViewModel = mapViewModelOf(towns)
        runCurrent()
        val failed: MapUiState = viewModel.state.value
        towns.answerMap(RegionMapResult.Read(regionMapOf()))

        viewModel.onIntent(MapIntent.RetryTapped)
        runCurrent()

        assertEquals(MapUiState.Failed, failed)
        assertEquals(listOf<Int?>(null, null), towns.mapReads)
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
                FakeTownRepository.JobRequest(
                    target = JobTarget(area = 1, site = 1),
                    team = mapOf(TownHireKind.Worker to 2, TownHireKind.Truck to 1),
                    hours = 3,
                ),
            ),
            towns.jobSends,
        )
    }

    @Test
    fun `closes the form once the api takes the job`() = runTest {
        val viewModel: MapViewModel = formFilled()
        towns.answerJob(TownJobResult.Answered(townOf(job = jobOf())))

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

        assertEquals(1, towns.jobSends.size)
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

        assertEquals(emptyList<FakeTownRepository.JobRequest>(), towns.jobSends)
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
    fun `blocks a second job while a team is out`() = runTest {
        val viewModel: MapViewModel = formFilled(town = townOf(job = jobOf()), workers = "1", trucks = "0")

        assertEquals(MapUiState.JobBlock.TeamAlreadyOut, blockOf(viewModel))
    }

    @Test
    fun `blocks a team larger than the one at home`() = runTest {
        val viewModel: MapViewModel = formFilled(town = townOf(workers = 3, trucks = 1), workers = "5", trucks = "2")

        assertEquals(
            MapUiState.JobBlock.NotEnoughHiresAtHome(TownHireKind.Worker, count = 5, atHome = 3),
            blockOf(viewModel),
        )
    }

    @Test
    fun `asks the api for a blocked team and draws its refusal under the form`() = runTest {
        val refusal: TownJobRefusal = TownJobRefusal.NotEnoughHiresAtHome(TownHireKind.Worker, count = 5, atHome = 3)
        val viewModel: MapViewModel = formFilled(town = townOf(workers = 3), workers = "5")
        towns.answerJob(TownJobResult.Refused(refusal))

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

        assertEquals(listOf(readInstant), towns.callBacks)
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
}
