package com.emm.mygame.feature.town.building

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.feature.town.TownViewModel
import com.emm.mygame.feature.town.TownViewModelFixture
import com.emm.mygame.feature.town.contentOf
import com.emm.mygame.feature.town.moneyOf
import com.emm.mygame.feature.town.readInstant
import com.emm.mygame.feature.town.stockOf
import com.emm.mygame.feature.town.stocksOf
import com.emm.mygame.feature.town.townOf
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes

class StockLinesViewModelTest : TownViewModelFixture() {

    @Test
    fun `draws the four stocks in the order the api gave them`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        assertEquals(
            listOf(
                TownResourceKind.Money,
                TownResourceKind.Food,
                TownResourceKind.Power,
                TownResourceKind.Material,
            ),
            contentOf(viewModel).stocks.map { stock: StockLine -> stock.kind },
        )
    }

    @Test
    fun `draws the rate per hour as a whole number`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, ratePerHour = 30.9))))

        assertEquals(30L, moneyOf(viewModel).ratePerHour)
    }

    @Test
    fun `projects each stock between reads up to storage`() = runTest {
        val rising: TownSnapshot = townOf(
            stocks = stocksOf(
                stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0, capacity = 1000),
                stockOf(TownResourceKind.Food, amount = 995, ratePerHour = 600.0, capacity = 1000),
            ),
        )
        val viewModel: TownViewModel = homeViewModel(rising)

        advanceTimeBy(2.minutes)
        runCurrent()

        assertEquals(
            listOf(102L, 1000L),
            contentOf(viewModel).stocks.take(2).map { stock: StockLine -> stock.amount },
        )
    }

    @Test
    fun `counts the skills earned on a resource as its skill level`() = runTest {
        val viewModel: TownViewModel = homeViewModel(
            townOf(
                skills = listOf(
                    TownSnapshot.EarnedSkill(LessonId("lesson-1"), TownResourceKind.Money, ratePercent = 5),
                    TownSnapshot.EarnedSkill(LessonId("lesson-2"), TownResourceKind.Food, ratePercent = 5),
                    TownSnapshot.EarnedSkill(LessonId("lesson-3"), TownResourceKind.Money, ratePercent = 5),
                ),
            ),
        )

        assertEquals(2, moneyOf(viewModel).skillLevel)
    }

    @Test
    fun `marks a stock full at its capacity`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 1000, capacity = 1000))))

        assertTrue(moneyOf(viewModel).isFull)
    }

    @Test
    fun `projects from the server's clock on a skewed device`() = runTest {
        val rising: TownSnapshot =
            townOf(stocks = stocksOf(stockOf(TownResourceKind.Money, amount = 100, ratePerHour = 60.0)))
        val viewModel: TownViewModel = homeViewModel(rising, start = readInstant - 3.hours)

        advanceTimeBy(1.minutes)
        runCurrent()

        assertEquals(101L, moneyOf(viewModel).amount)
    }
}
