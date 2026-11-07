package com.emm.mygame.feature.town

import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class TownHeldTownTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    @Test
    fun `draws the held town before the re-read answers`() = runTest {
        towns.hold(HeldTown(townOf(name = "Maple"), gap = Duration.ZERO))

        val viewModel: TownViewModel = townViewModelOf(towns, start = readInstant)

        assertEquals("Maple", contentOf(viewModel).name)
    }

    @Test
    fun `re-reads the town behind the held one`() = runTest {
        towns.hold(HeldTown(townOf(name = "Maple"), gap = Duration.ZERO))

        townViewModelOf(towns, start = readInstant)
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `replaces the held town with the re-read`() = runTest {
        towns.hold(HeldTown(townOf(name = "Maple"), gap = Duration.ZERO))
        val viewModel: TownViewModel = townViewModelOf(towns, start = readInstant)

        towns.answerRead(TownReadResult.Read(townOf(name = "Riverton")))
        runCurrent()

        assertEquals("Riverton", contentOf(viewModel).name)
    }

    @Test
    fun `keeps the held town when the re-read fails`() = runTest {
        towns.hold(HeldTown(townOf(name = "Maple"), gap = Duration.ZERO))
        val viewModel: TownViewModel = townViewModelOf(towns, start = readInstant)

        towns.answerRead(TownReadResult.Unreachable)
        runCurrent()

        assertEquals("Maple", contentOf(viewModel).name)
    }

    @Test
    fun `asks for a name when the re-read finds no town`() = runTest {
        towns.hold(HeldTown(townOf(name = "Maple"), gap = Duration.ZERO))
        val viewModel: TownViewModel = townViewModelOf(towns, start = readInstant)

        towns.answerRead(TownReadResult.NoTown)
        runCurrent()

        assertEquals(TownUiState.Naming(name = "", status = TownUiState.NamingStatus.Idle), viewModel.state.value)
    }

    @Test
    fun `projects the held town with the gap measured when it arrived`() = runTest {
        towns.hold(HeldTown(townOf(slot = workOf(lasting = 10.minutes)), gap = Duration.ZERO))

        val viewModel: TownViewModel = townViewModelOf(towns, start = readInstant + 60.seconds)

        assertEquals(9.minutes, (contentOf(viewModel).slot as TownUiState.SlotLine.Busy).remaining)
    }
}
