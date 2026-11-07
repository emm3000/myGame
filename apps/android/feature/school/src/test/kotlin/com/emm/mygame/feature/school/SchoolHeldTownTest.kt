package com.emm.mygame.feature.school

import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SchoolHeldTownTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    @Test
    fun `draws the held town before the re-read answers`() = runTest {
        towns.hold(HeldTown(townOf(schoolLevel = 3), gap = Duration.ZERO))

        val viewModel: SchoolViewModel = schoolViewModelOf(towns)

        assertEquals(3, contentOf(viewModel).schoolLevel)
    }

    @Test
    fun `re-reads the town behind the held one`() = runTest {
        towns.hold(HeldTown(townOf(schoolLevel = 3), gap = Duration.ZERO))

        schoolViewModelOf(towns)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `replaces the held town with the re-read`() = runTest {
        towns.hold(HeldTown(townOf(schoolLevel = 3), gap = Duration.ZERO))
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)

        towns.answerRead(TownReadResult.Read(townOf(schoolLevel = 4)))
        runCurrent()

        assertEquals(4, contentOf(viewModel).schoolLevel)
    }

    @Test
    fun `keeps the held town when the re-read fails`() = runTest {
        towns.hold(HeldTown(townOf(schoolLevel = 3), gap = Duration.ZERO))
        val viewModel: SchoolViewModel = schoolViewModelOf(towns)

        towns.answerRead(TownReadResult.Unreachable)
        runCurrent()

        assertEquals(3, contentOf(viewModel).schoolLevel)
    }

    @Test
    fun `projects the held town with the gap measured when it arrived`() = runTest {
        val runningLesson: HeldTown = HeldTown(townOf(lessonSlot = slotOf(lasting = 150.seconds)), gap = Duration.ZERO)
        towns.hold(runningLesson)

        val viewModel: SchoolViewModel = schoolViewModelOf(towns, start = readInstant + 60.seconds)

        assertEquals(
            SchoolUiState.SlotLine.Busy(firstLesson, number = 1, remaining = 90.seconds, total = 150.seconds),
            contentOf(viewModel).slot,
        )
    }
}
