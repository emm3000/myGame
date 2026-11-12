package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.Placement
import com.emm.mygame.core.network.PlacementAnswer
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementChangeResult
import com.emm.mygame.core.network.PlacementReadResult
import com.emm.mygame.core.testing.FakePlacementRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import com.emm.mygame.core.testing.PlacementChange
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class PlacementViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val placements: FakePlacementRepository = FakePlacementRepository()

    private fun TestScope.placementReading(placement: Placement): PlacementViewModel {
        val viewModel: PlacementViewModel = PlacementViewModel(placements)
        placements.answerRead(PlacementReadResult.Read(placement))
        runCurrent()
        return viewModel
    }

    private fun TestScope.askingWithEveryWordChosen(): PlacementViewModel {
        val viewModel: PlacementViewModel = placementReading(firstBandAsked)
        viewModel.onIntent(PlacementIntent.ChoiceChosen(houseMeaning))
        viewModel.onIntent(PlacementIntent.NextTapped)
        viewModel.onIntent(PlacementIntent.ChoiceChosen(walkMeaning))
        return viewModel
    }

    private fun askingOf(viewModel: PlacementViewModel): PlacementUiState.Asking =
        viewModel.state.value as PlacementUiState.Asking

    @Test
    fun `draws loading until the placement answers`() = runTest {
        val viewModel: PlacementViewModel = PlacementViewModel(placements)
        runCurrent()

        assertEquals(PlacementUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `draws the offer the api answers`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        assertEquals(PlacementUiState.Offered(PlacementRequest.Idle), viewModel.state.value)
    }

    @Test
    fun `draws failed when the placement cannot be read`() = runTest {
        val viewModel: PlacementViewModel = PlacementViewModel(placements)
        placements.answerRead(PlacementReadResult.Unreachable)
        runCurrent()

        assertEquals(PlacementUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads the placement again on retry`() = runTest {
        val viewModel: PlacementViewModel = PlacementViewModel(placements)
        placements.answerRead(PlacementReadResult.Unreachable)
        runCurrent()

        viewModel.onIntent(PlacementIntent.RetryTapped)
        placements.answerRead(PlacementReadResult.Read(Placement.Offered))
        runCurrent()

        assertEquals(PlacementUiState.Offered(PlacementRequest.Idle), viewModel.state.value)
    }

    @Test
    fun `begins the placement when the player starts it`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.StartTapped)
        runCurrent()

        assertEquals(listOf(PlacementChange.Begin), placements.changes)
    }

    @Test
    fun `draws the start waiting while the api begins the placement`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.StartTapped)
        runCurrent()

        assertEquals(
            PlacementUiState.Offered(PlacementRequest.Waiting(PlacementAction.Begin)),
            viewModel.state.value,
        )
    }

    @Test
    fun `sends one change at a time`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.StartTapped)
        viewModel.onIntent(PlacementIntent.SkipTapped)
        runCurrent()

        assertEquals(listOf(PlacementChange.Begin), placements.changes)
    }

    @Test
    fun `draws the first word of the band the api asks`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.StartTapped)
        placements.answerChange(PlacementChangeResult.Changed(firstBandAsked))
        runCurrent()

        assertEquals(house, askingOf(viewModel).shown)
    }

    @Test
    fun `skips the placement when the player skips it`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.SkipTapped)
        runCurrent()

        assertEquals(listOf(PlacementChange.Skip), placements.changes)
    }

    @Test
    fun `draws the closed placement the api answers to a skip`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.SkipTapped)
        placements.answerChange(PlacementChangeResult.Changed(skipped))
        runCurrent()

        assertEquals(PlacementUiState.Closed(emptyList()), viewModel.state.value)
    }

    @Test
    fun `keeps the offer with the outage when the start cannot reach the api`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.StartTapped)
        placements.answerChange(PlacementChangeResult.Unreachable)
        runCurrent()

        assertEquals(PlacementUiState.Offered(PlacementRequest.Unreachable), viewModel.state.value)
    }

    @Test
    fun `reads the placement again when the api refuses a change`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.SkipTapped)
        placements.answerChange(PlacementChangeResult.Refused)
        runCurrent()

        assertEquals(2, placements.readCount)
    }

    @Test
    fun `draws the placement the re-read answers after a refusal`() = runTest {
        val viewModel: PlacementViewModel = placementReading(Placement.Offered)

        viewModel.onIntent(PlacementIntent.SkipTapped)
        placements.answerChange(PlacementChangeResult.Refused)
        placements.answerRead(PlacementReadResult.Read(placedAtSecondBand))
        runCurrent()

        assertEquals(PlacementUiState.Closed(placedAtSecondBand.scores), viewModel.state.value)
    }

    @Test
    fun `keeps the chosen meaning of the shown word`() = runTest {
        val viewModel: PlacementViewModel = placementReading(firstBandAsked)

        viewModel.onIntent(PlacementIntent.ChoiceChosen(dogMeaning))

        assertEquals(dogMeaning, askingOf(viewModel).chosenForShown)
    }

    @Test
    fun `shows the next word once the shown word has a meaning chosen`() = runTest {
        val viewModel: PlacementViewModel = placementReading(firstBandAsked)

        viewModel.onIntent(PlacementIntent.ChoiceChosen(houseMeaning))
        viewModel.onIntent(PlacementIntent.NextTapped)

        assertEquals(walk, askingOf(viewModel).shown)
    }

    @Test
    fun `stays on the shown word while it has no meaning chosen`() = runTest {
        val viewModel: PlacementViewModel = placementReading(firstBandAsked)

        viewModel.onIntent(PlacementIntent.NextTapped)

        assertEquals(house, askingOf(viewModel).shown)
    }

    @Test
    fun `sends every answer of the band in one request`() = runTest {
        val viewModel: PlacementViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(PlacementIntent.BandSent)
        runCurrent()

        assertEquals(
            listOf(
                PlacementChange.Answer(
                    PlacementBand.First,
                    listOf(PlacementAnswer(house.word, houseMeaning), PlacementAnswer(walk.word, walkMeaning)),
                ),
            ),
            placements.changes,
        )
    }

    @Test
    fun `sends no band while its last word has no meaning chosen`() = runTest {
        val viewModel: PlacementViewModel = placementReading(firstBandAsked)
        viewModel.onIntent(PlacementIntent.ChoiceChosen(houseMeaning))
        viewModel.onIntent(PlacementIntent.NextTapped)

        viewModel.onIntent(PlacementIntent.BandSent)
        runCurrent()

        assertEquals(emptyList<PlacementChange>(), placements.changes)
    }

    @Test
    fun `draws the next band the api asks after the answers`() = runTest {
        val viewModel: PlacementViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(PlacementIntent.BandSent)
        placements.answerChange(PlacementChangeResult.Changed(secondBandAsked))
        runCurrent()

        assertEquals(PlacementBand.Second, askingOf(viewModel).band)
    }

    @Test
    fun `starts the next band at its first word with no meaning chosen`() = runTest {
        val viewModel: PlacementViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(PlacementIntent.BandSent)
        placements.answerChange(PlacementChangeResult.Changed(secondBandAsked))
        runCurrent()

        assertEquals(null, askingOf(viewModel).chosenForShown)
    }

    @Test
    fun `draws each band's score the api answers once the placement closes`() = runTest {
        val viewModel: PlacementViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(PlacementIntent.BandSent)
        placements.answerChange(PlacementChangeResult.Changed(placedAtSecondBand))
        runCurrent()

        assertEquals(PlacementUiState.Closed(placedAtSecondBand.scores), viewModel.state.value)
    }

    @Test
    fun `keeps the chosen meanings when the answers cannot reach the api`() = runTest {
        val viewModel: PlacementViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(PlacementIntent.BandSent)
        placements.answerChange(PlacementChangeResult.Unreachable)
        runCurrent()

        assertEquals(mapOf(house.word to houseMeaning, walk.word to walkMeaning), askingOf(viewModel).chosen)
    }

    @Test
    fun `draws the outage when the answers cannot reach the api`() = runTest {
        val viewModel: PlacementViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(PlacementIntent.BandSent)
        placements.answerChange(PlacementChangeResult.Unreachable)
        runCurrent()

        assertEquals(PlacementRequest.Unreachable, askingOf(viewModel).request)
    }

    @Test
    fun `sends the band once while its answers wait`() = runTest {
        val viewModel: PlacementViewModel = askingWithEveryWordChosen()

        viewModel.onIntent(PlacementIntent.BandSent)
        runCurrent()
        viewModel.onIntent(PlacementIntent.BandSent)
        runCurrent()

        assertEquals(1, placements.changes.size)
    }

    @Test
    fun `clears the outage once the player chooses another meaning`() = runTest {
        val viewModel: PlacementViewModel = askingWithEveryWordChosen()
        viewModel.onIntent(PlacementIntent.BandSent)
        placements.answerChange(PlacementChangeResult.Unreachable)
        runCurrent()

        viewModel.onIntent(PlacementIntent.ChoiceChosen(walkMeaning))

        assertEquals(PlacementRequest.Idle, askingOf(viewModel).request)
    }
}
