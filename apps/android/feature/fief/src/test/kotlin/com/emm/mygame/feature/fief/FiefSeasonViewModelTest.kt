package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefSeasonViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val readAt: Instant = firstReadAt

    @Test
    fun `re-reads the fief when the season ends with no work running`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(seasonEndsAt = readAt + 1.minutes)))
        fiefs.answerRead(FiefReadResult.Read(nextSeason(readAt = readAt + 1.minutes)))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(1.minutes - 1.seconds)
            runCurrent()
            assertEquals(1, fiefs.readCount)
            advanceTimeBy(1.seconds)
            runCurrent()
            cancelAndIgnoreRemainingEvents()
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `draws the rates of the answer read at the season's end`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val seasonEnd: Instant = readAt + 1.minutes
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(resources = listOf(wood(amount = 500, ratePerHour = 60.0)), seasonEndsAt = seasonEnd),
            ),
        )
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(
                    resources = listOf(wood(amount = 501, ratePerHour = 3600.0)),
                    readAt = seasonEnd,
                    seasonEndsAt = seasonEnd + 7.days,
                ),
            ),
        )

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(501L, awaitContentWhere { it.resources.single().amount == 501L }.resources.single().amount)
            advanceTimeBy(1.minutes)
            runCurrent()
            assertEquals(561L, awaitContent().resources.single().amount)
        }
    }

    @Test
    fun `reads nothing more while the overview carries no season`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(seasonEndsAt = null)))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(10.minutes)
            runCurrent()
            cancelAndIgnoreRemainingEvents()
        }
        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `repaints every second in the season's last minute`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(
            FiefReadResult.Read(
                fief(resources = listOf(wood(amount = 500, ratePerHour = 3600.0)), seasonEndsAt = readAt + 90.seconds),
            ),
        )

        viewModel.state.test {
            assertEquals(500L, awaitContent().resources.single().amount)
            advanceTimeBy(30.seconds)
            runCurrent()
            assertEquals(530L, awaitContent().resources.single().amount)
            advanceTimeBy(1.seconds)
            runCurrent()
            assertEquals(531L, awaitContent().resources.single().amount)
        }
    }

    private fun nextSeason(readAt: Instant): FiefSnapshot =
        fief(readAt = readAt, seasonEndsAt = readAt + 7.days)
}
