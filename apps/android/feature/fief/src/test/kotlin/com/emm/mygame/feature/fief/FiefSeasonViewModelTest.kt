package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.hours
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

    @Test
    fun `draws the season in force with its year`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Autumn, endsIn = 3.days))

        viewModel.state.test {
            val season: FiefUiState.SeasonLine? = awaitContent().season
            assertEquals(SeasonKind.Autumn, season?.kind)
            assertEquals(1, season?.year)
        }
    }

    @Test
    fun `counts down to summer in spring`() = runTest {
        assertEquals(SeasonKind.Summer, nextSeasonDrawnIn(SeasonKind.Spring))
    }

    @Test
    fun `counts down to autumn in summer`() = runTest {
        assertEquals(SeasonKind.Autumn, nextSeasonDrawnIn(SeasonKind.Summer))
    }

    @Test
    fun `counts down to winter in autumn`() = runTest {
        assertEquals(SeasonKind.Winter, nextSeasonDrawnIn(SeasonKind.Autumn))
    }

    @Test
    fun `counts down to spring after winter`() = runTest {
        assertEquals(SeasonKind.Spring, nextSeasonDrawnIn(SeasonKind.Winter))
    }

    @Test
    fun `counts the whole days left while at least one day is left`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Autumn, endsIn = 3.days + 23.hours))

        viewModel.state.test {
            assertEquals(FiefUiState.SeasonCountdown.InDays(days = 3), awaitContent().season?.countdown)
        }
    }

    @Test
    fun `counts one day left at exactly a day`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Autumn, endsIn = 1.days))

        viewModel.state.test {
            assertEquals(FiefUiState.SeasonCountdown.InDays(days = 1), awaitContent().season?.countdown)
        }
    }

    @Test
    fun `counts the time left under a day as a countdown`() = runTest {
        val underADay: Duration = 23.hours + 59.minutes
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Autumn, endsIn = underADay))

        viewModel.state.test {
            assertEquals(FiefUiState.SeasonCountdown.UnderADay(remaining = underADay), awaitContent().season?.countdown)
        }
    }

    @Test
    fun `draws no season while the overview carries none`() = runTest {
        val viewModel: FiefViewModel = openOn(fief(seasonInForce = null, seasonEndsAt = null))

        viewModel.state.test {
            assertNull(awaitContent().season)
        }
    }

    @Test
    fun `repaints the season countdown a minute later`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Autumn, endsIn = 5.hours))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(1.minutes)
            runCurrent()
            val countdown: FiefUiState.SeasonCountdown? = awaitContent().season?.countdown
            assertEquals(FiefUiState.SeasonCountdown.UnderADay(remaining = 5.hours - 1.minutes), countdown)
        }
    }

    @Test
    fun `repaints the season countdown every second in its last minute`() = runTest {
        val viewModel: FiefViewModel = openOn(seasonal(SeasonKind.Autumn, endsIn = 30.seconds))

        viewModel.state.test {
            awaitContent()
            advanceTimeBy(1.seconds)
            runCurrent()
            val countdown: FiefUiState.SeasonCountdown? = awaitContent().season?.countdown
            assertEquals(FiefUiState.SeasonCountdown.UnderADay(remaining = 29.seconds), countdown)
        }
    }

    private suspend fun TestScope.nextSeasonDrawnIn(kind: SeasonKind): SeasonKind? {
        val viewModel: FiefViewModel = openOn(seasonal(kind, endsIn = 3.days))
        var next: SeasonKind? = null
        viewModel.state.test {
            next = awaitContent().season?.next
        }
        return next
    }

    private fun TestScope.openOn(read: FiefSnapshot): FiefViewModel {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(read))
        return viewModel
    }

    private fun seasonal(kind: SeasonKind, endsIn: Duration): FiefSnapshot =
        fief(seasonInForce = SeasonInForce(kind = kind, year = 1), seasonEndsAt = readAt + endsIn)

    private fun nextSeason(readAt: Instant): FiefSnapshot =
        fief(readAt = readAt, seasonEndsAt = readAt + 7.days)
}
