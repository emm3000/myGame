package com.emm.mygame.feature.school

import com.emm.mygame.core.network.HoldoutCheck
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.HoldoutChecksReadResult
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.testing.FakeHoldoutCheckRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class HoldoutCheckRowsViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val holdoutChecks: FakeHoldoutCheckRepository = FakeHoldoutCheckRepository()

    private val firstBandDue: HoldoutCheck.Due = HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)

    private val secondBandAsking: HoldoutCheck.Asking =
        HoldoutCheck.Asking(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth, emptyList())

    private fun TestScope.shownWith(answer: HoldoutChecksReadResult): HoldoutCheckRowsViewModel {
        val viewModel: HoldoutCheckRowsViewModel = HoldoutCheckRowsViewModel(holdoutChecks)
        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenShown)
        holdoutChecks.answerRead(answer)
        runCurrent()
        return viewModel
    }

    @Test
    fun `draws no row before the school is shown`() = runTest {
        val viewModel: HoldoutCheckRowsViewModel = HoldoutCheckRowsViewModel(holdoutChecks)
        runCurrent()

        assertEquals(0, holdoutChecks.readCount)
        assertEquals(HoldoutCheckRowsUiState(emptyList()), viewModel.state.value)
    }

    @Test
    fun `draws a row for each due check`() = runTest {
        val viewModel: HoldoutCheckRowsViewModel =
            shownWith(HoldoutChecksReadResult.Read(listOf(firstBandDue, secondBandAsking)))

        assertEquals(
            HoldoutCheckRowsUiState(
                listOf(
                    HoldoutCheckRow(PlacementBand.First, HoldoutCheckWeek.Eighth),
                    HoldoutCheckRow(PlacementBand.Second, HoldoutCheckWeek.TwentyFourth),
                ),
            ),
            viewModel.state.value,
        )
    }

    @Test
    fun `draws no row when no check is due`() = runTest {
        val viewModel: HoldoutCheckRowsViewModel = shownWith(HoldoutChecksReadResult.Read(emptyList()))

        assertEquals(HoldoutCheckRowsUiState(emptyList()), viewModel.state.value)
    }

    @Test
    fun `draws no row when the read fails`() = runTest {
        val viewModel: HoldoutCheckRowsViewModel = shownWith(HoldoutChecksReadResult.Unreachable)

        assertEquals(HoldoutCheckRowsUiState(emptyList()), viewModel.state.value)
    }

    @Test
    fun `drops the rows a later read no longer names`() = runTest {
        val viewModel: HoldoutCheckRowsViewModel = shownWith(HoldoutChecksReadResult.Read(listOf(firstBandDue)))
        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenHidden)

        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenShown)
        holdoutChecks.answerRead(HoldoutChecksReadResult.Read(emptyList()))
        runCurrent()

        assertEquals(HoldoutCheckRowsUiState(emptyList()), viewModel.state.value)
    }

    @Test
    fun `reads the checks again each time the school is shown`() = runTest {
        val viewModel: HoldoutCheckRowsViewModel = shownWith(HoldoutChecksReadResult.Read(emptyList()))
        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenHidden)

        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenShown)
        runCurrent()

        assertEquals(2, holdoutChecks.readCount)
    }

    @Test
    fun `draws nothing a read answers after the school is hidden`() = runTest {
        val viewModel: HoldoutCheckRowsViewModel = HoldoutCheckRowsViewModel(holdoutChecks)
        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenShown)
        runCurrent()

        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenHidden)
        holdoutChecks.answerRead(HoldoutChecksReadResult.Read(listOf(firstBandDue)))
        runCurrent()

        assertEquals(HoldoutCheckRowsUiState(emptyList()), viewModel.state.value)
    }
}
