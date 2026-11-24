package com.emm.mygame.feature.town.building.work

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

class SlotLineViewModelTest : TownViewModelFixture() {

    @Test
    fun `draws an idle slot when no work runs`() = runTest {
        assertEquals(SlotLine.Idle, contentOf(homeViewModel(townOf())).slot)
    }

    @Test
    fun `counts the slot down to its finish`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, level = 2, startsAt = readInstant - 5.minutes)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(
            SlotLine.Busy(
                building = TownBuildingKind.Farm,
                level = 2,
                remaining = 4.minutes,
                total = 10.minutes,
                finishesAt = readInstant + 5.minutes,
            ),
            contentOf(viewModel).slot,
        )
    }

    @Test
    fun `repaints each second in the last minute of the slot`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(slot = workOf(lasting = 90.seconds)))

        advanceTimeBy(32.seconds)
        runCurrent()

        assertEquals(58.seconds, (contentOf(viewModel).slot as SlotLine.Busy).remaining)
    }

    @Test
    fun `gives the finish on the device's clock`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(lasting = 10.minutes)), start = readInstant - 3.hours)

        assertEquals(
            readInstant - 3.hours + 10.minutes,
            (contentOf(viewModel).slot as SlotLine.Busy).finishesAt,
        )
    }

    @Test
    fun `tells the slot is done until the next read answers`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(slot = workOf(TownBuildingKind.Farm, 2, lasting = 1.minutes)))

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(SlotLine.Done(TownBuildingKind.Farm, level = 2), contentOf(viewModel).slot)
    }
}
