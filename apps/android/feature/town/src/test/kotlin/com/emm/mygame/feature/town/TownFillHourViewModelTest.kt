package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.feature.town.building.FillTime
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes

class TownFillHourViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    @Test
    fun `counts the fill hour down on the repaint without a read`() = runTest {
        val fillingMoney: TownSnapshot.Stock =
            stockOf(TownResourceKind.Money, ratePerHour = 60.0, fullAt = readInstant + 3.hours)
        towns.answerRead(TownReadResult.Read(townOf(stocks = stocksOf(fillingMoney))))
        val viewModel: TownViewModel = townViewModelOf(towns, readInstant)

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(
            FillTime(remaining = 3.hours - 1.minutes, fullAt = readInstant + 3.hours),
            moneyOf(viewModel).fill,
        )
        assertEquals(1, towns.readCount)
    }
}
