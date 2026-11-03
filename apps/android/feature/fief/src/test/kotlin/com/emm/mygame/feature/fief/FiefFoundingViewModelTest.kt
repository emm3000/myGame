package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.AwayMarch
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefSnapshot
import com.emm.mygame.core.network.MarchOrder
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefFoundingViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val founding: AwayMarch =
        forageOfInfantry(count = 0, arrivesIn = 5.minutes, foragesFor = 0.minutes, order = MarchOrder.Found)

    @Test
    fun `tells a founding applied when the read at its arrival answers it gone`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(founding)))
        fiefs.answerRead(FiefReadResult.Read(marching(march = null)))

        viewModel.effects.test {
            assertEquals(FiefEffect.FoundingApplied, awaitItem())
        }
    }

    @Test
    fun `tells no founding while the founding is still on the way`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(marching(founding)))
        fiefs.answerRead(FiefReadResult.Read(marching(founding)))

        viewModel.effects.test {
            viewModel.onIntent(FiefIntent.ScreenHidden)
            viewModel.onIntent(FiefIntent.ScreenShown)

            expectNoEvents()
        }
        assertEquals(2, fiefs.readCount)
    }

    @Test
    fun `tells no founding when a recalled founding comes home`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        val recalled: AwayMarch = founding.copy(recalledAt = founding.departedAt + 1.minutes)
        fiefs.answerRead(FiefReadResult.Read(marching(recalled)))
        fiefs.answerRead(FiefReadResult.Read(marching(march = null)))

        viewModel.effects.test {
            viewModel.onIntent(FiefIntent.ScreenHidden)
            viewModel.onIntent(FiefIntent.ScreenShown)

            expectNoEvents()
        }
        assertEquals(2, fiefs.readCount)
    }

    private fun marching(march: AwayMarch?): FiefSnapshot = fief(
        buildings = listOf(barracks(level = 1)),
        units = army(infantryAtHome = 4, infantryAway = 0),
        march = march,
    )
}
