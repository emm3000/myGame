package com.emm.mygame.feature.town

import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.feature.town.building.PeopleLine
import com.emm.mygame.feature.town.building.WordsLine
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class TownReadViewModelTest : TownViewModelFixture() {

    @Test
    fun `draws the loading state while the api reads the town`() = runTest {
        val viewModel: TownViewModel = viewModelOf()

        assertEquals(TownUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `draws the failure when the town cannot be read`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)

        assertEquals(TownUiState.Failed, viewModelOf().state.value)
    }

    @Test
    fun `reads the town again on retry`() = runTest {
        towns.answerRead(TownReadResult.Unreachable)
        val viewModel: TownViewModel = viewModelOf()
        towns.answerRead(TownReadResult.Read(townOf(name = "Riverton")))

        viewModel.onIntent(TownIntent.RetryTapped)

        assertEquals("Riverton", contentOf(viewModel).name)
    }

    @Test
    fun `ignores a retry unless the read failed`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf())

        viewModel.onIntent(TownIntent.RetryTapped)

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `labels a town the api calls a city`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(label = TownLabel.City))

        assertEquals(TownLabel.City, contentOf(viewModel).label)
    }

    @Test
    fun `draws the people free and at work`() = runTest {
        val viewModel: TownViewModel =
            homeViewModel(townOf(people = TownSnapshot.People(supplied = 30, free = 24, atWork = 6)))

        assertEquals(PeopleLine(free = 24, atWork = 6), contentOf(viewModel).people)
    }

    @Test
    fun `draws the town's reviewed and learned words`() = runTest {
        val viewModel: TownViewModel = homeViewModel(townOf(stableWordCount = 14, retainedWordCount = 3))

        assertEquals(WordsLine(stable = 14, retained = 3), contentOf(viewModel).words)
    }
}
