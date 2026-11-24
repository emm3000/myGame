package com.emm.mygame.feature.town.building.work

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.feature.town.TownViewModel
import com.emm.mygame.feature.town.TownViewModelFixture
import com.emm.mygame.feature.town.contentOf
import com.emm.mygame.feature.town.readInstant
import com.emm.mygame.feature.town.townOf
import com.emm.mygame.feature.town.workOf
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds

class WaitingLineViewModelTest : TownViewModelFixture() {

    @Test
    fun `draws the waiting list with its countdowns`() = runTest {
        val waiting: TownSnapshot.WorkItem = workOf(TownBuildingKind.School, level = 3, lasting = 20.minutes)

        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(), waitingList = listOf(waiting)))

        assertEquals(
            listOf(
                WaitingLine(
                    building = TownBuildingKind.School,
                    level = 3,
                    remaining = 20.minutes,
                    finishesAt = readInstant + 20.minutes,
                ),
            ),
            contentOf(viewModel).waitingList,
        )
    }

    @Test
    fun `counts waiting work down each second in its last minute`() = runTest {
        val waiting: TownSnapshot.WorkItem = workOf(TownBuildingKind.School, 3, lasting = 30.seconds)
        val viewModel: TownViewModel = homeViewModel(townOf(waitingList = listOf(waiting)))

        advanceTimeBy(10.seconds)
        runCurrent()

        assertEquals(20.seconds, contentOf(viewModel).waitingList.single().remaining)
    }

    @Test
    fun `gives waiting work its finish on the device's clock`() = runTest {
        val waiting: TownSnapshot.WorkItem =
            workOf(TownBuildingKind.School, 3, startsAt = readInstant + 10.minutes, lasting = 20.minutes)

        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(), waitingList = listOf(waiting)), start = readInstant - 3.hours)

        assertEquals(readInstant + 30.minutes - 3.hours, contentOf(viewModel).waitingList.single().finishesAt)
    }
}
