package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementReadResult
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class PlacementOfferViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val placements: FakePlacementRepository = FakePlacementRepository()

    private fun TestScope.offerShowing(placement: PlacementReadResult): PlacementOfferViewModel {
        val viewModel: PlacementOfferViewModel = PlacementOfferViewModel(placements)
        viewModel.onIntent(PlacementOfferIntent.ScreenShown)
        placements.answerRead(placement)
        runCurrent()
        return viewModel
    }

    @Test
    fun `draws nothing until the placement answers`() = runTest {
        val viewModel: PlacementOfferViewModel = PlacementOfferViewModel(placements)
        viewModel.onIntent(PlacementOfferIntent.ScreenShown)
        runCurrent()

        assertEquals(PlacementOfferUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `offers the placement the api offers`() = runTest {
        val viewModel: PlacementOfferViewModel = offerShowing(PlacementReadResult.Read(Placement.Offered))

        assertEquals(PlacementOfferUiState.Offered, viewModel.state.value)
    }

    @Test
    fun `offers to go on with a band the api is asking`() = runTest {
        val viewModel: PlacementOfferViewModel = offerShowing(PlacementReadResult.Read(firstBandAsked))

        assertEquals(PlacementOfferUiState.Asking, viewModel.state.value)
    }

    @Test
    fun `draws nothing for a closed placement`() = runTest {
        val viewModel: PlacementOfferViewModel = offerShowing(PlacementReadResult.Read(skipped))

        assertEquals(PlacementOfferUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `draws nothing when the placement cannot be read`() = runTest {
        val viewModel: PlacementOfferViewModel = offerShowing(PlacementReadResult.Unreachable)

        assertEquals(PlacementOfferUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `hides the offer once the town shows again after the placement closed`() = runTest {
        val viewModel: PlacementOfferViewModel = offerShowing(PlacementReadResult.Read(Placement.Offered))
        viewModel.onIntent(PlacementOfferIntent.ScreenHidden)

        viewModel.onIntent(PlacementOfferIntent.ScreenShown)
        placements.answerRead(PlacementReadResult.Read(placedAtSecondBand))
        runCurrent()

        assertEquals(PlacementOfferUiState.Hidden, viewModel.state.value)
    }

    @Test
    fun `reads nothing while the town is hidden`() = runTest {
        val viewModel: PlacementOfferViewModel = offerShowing(PlacementReadResult.Read(Placement.Offered))

        viewModel.onIntent(PlacementOfferIntent.ScreenHidden)
        runCurrent()

        assertEquals(1, placements.readCount)
    }
}
