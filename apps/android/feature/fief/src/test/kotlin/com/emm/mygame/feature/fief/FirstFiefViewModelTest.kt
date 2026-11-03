package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FirstFiefResult
import com.emm.mygame.core.testing.FakeFiefListRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FirstFiefViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val firstListed: FiefId = FiefId("7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17")

    @Test
    fun `draws the loading state while the api lists the fiefs`() = runTest {
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(FakeFiefListRepository())

        assertEquals(FirstFiefUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `opens the first fief the api lists`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings)

        viewModel.effects.test {
            listings.answerFirstListed(FirstFiefResult.Listed(firstListed))

            assertEquals(FirstFiefEffect.Opened(firstListed), awaitItem())
        }
    }

    @Test
    fun `draws the no-fief line when the api lists none`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings)

        listings.answerFirstListed(FirstFiefResult.NoFief)

        assertEquals(FirstFiefUiState.NoFief, viewModel.state.value)
    }

    @Test
    fun `offers a retry when the api cannot be reached`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings)

        listings.answerFirstListed(FirstFiefResult.Unreachable)

        assertEquals(FirstFiefUiState.Unreachable, viewModel.state.value)
    }

    @Test
    fun `opens the first fief a retry finds after an outage`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings)
        listings.answerFirstListed(FirstFiefResult.Unreachable)

        viewModel.effects.test {
            viewModel.onIntent(FirstFiefIntent.RetryTapped)
            listings.answerFirstListed(FirstFiefResult.Listed(firstListed))

            assertEquals(FirstFiefEffect.Opened(firstListed), awaitItem())
        }
    }

    @Test
    fun `lists the fiefs again on a retry after an empty list`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings)
        listings.answerFirstListed(FirstFiefResult.NoFief)

        viewModel.onIntent(FirstFiefIntent.RetryTapped)

        assertEquals(2, listings.firstListedCount)
    }

    @Test
    fun `ignores a retry while the fiefs are listed`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings)

        viewModel.onIntent(FirstFiefIntent.RetryTapped)

        assertEquals(1, listings.firstListedCount)
    }
}
