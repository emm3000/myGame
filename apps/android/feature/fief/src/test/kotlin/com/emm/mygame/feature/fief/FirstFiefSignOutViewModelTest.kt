package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.FirstFiefResult
import com.emm.mygame.core.testing.FakeFiefListRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FirstFiefSignOutViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val firstListed: FiefId = FiefId("7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17")

    @Test
    fun `asks the api to sign out once however often the lord taps`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(FakeFiefListRepository(), sessions)

        viewModel.onIntent(FirstFiefIntent.SignOutTapped)
        viewModel.onIntent(FirstFiefIntent.SignOutTapped)
        runCurrent()

        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `marks the sign-out busy while it waits on the api`() = runTest {
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(FakeFiefListRepository(), FakeSessionRepository())

        viewModel.onIntent(FirstFiefIntent.SignOutTapped)

        assertEquals(FirstFiefUiState.SigningOut, viewModel.state.value)
    }

    @Test
    fun `goes to sign-in once the sign-out is done`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(FakeFiefListRepository(), sessions)

        viewModel.effects.test {
            viewModel.onIntent(FirstFiefIntent.SignOutTapped)
            sessions.answerSignOut()

            assertEquals(FirstFiefEffect.SignedOut, awaitItem())
        }
    }

    @Test
    fun `stays on the screen while the sign-out waits on the api`() = runTest {
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(FakeFiefListRepository(), FakeSessionRepository())

        viewModel.effects.test {
            viewModel.onIntent(FirstFiefIntent.SignOutTapped)
            runCurrent()

            expectNoEvents()
        }
    }

    @Test
    fun `opens no fief when the listing answers after sign out`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings, sessions)

        viewModel.effects.test {
            viewModel.onIntent(FirstFiefIntent.SignOutTapped)
            listings.answerFirstListed(FirstFiefResult.Listed(firstListed))
            sessions.answerSignOut()

            assertEquals(FirstFiefEffect.SignedOut, awaitItem())
        }
    }

    @Test
    fun `keeps the sign-out drawn when the listing answers after sign out`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings, FakeSessionRepository())

        viewModel.onIntent(FirstFiefIntent.SignOutTapped)
        listings.answerFirstListed(FirstFiefResult.Unreachable)
        runCurrent()

        assertEquals(FirstFiefUiState.SigningOut, viewModel.state.value)
    }

    @Test
    fun `signs out from the no-fief line`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings, sessions)
        listings.answerFirstListed(FirstFiefResult.NoFief)
        runCurrent()

        viewModel.onIntent(FirstFiefIntent.SignOutTapped)
        runCurrent()

        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `signs out from the outage line`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings, sessions)
        listings.answerFirstListed(FirstFiefResult.Unreachable)
        runCurrent()

        viewModel.onIntent(FirstFiefIntent.SignOutTapped)
        runCurrent()

        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `lists the fiefs no more when retry is tapped after sign out`() = runTest {
        val listings: FakeFiefListRepository = FakeFiefListRepository()
        val viewModel: FirstFiefViewModel = FirstFiefViewModel(listings, FakeSessionRepository())
        listings.answerFirstListed(FirstFiefResult.Unreachable)
        runCurrent()

        viewModel.onIntent(FirstFiefIntent.SignOutTapped)
        viewModel.onIntent(FirstFiefIntent.RetryTapped)
        runCurrent()

        assertEquals(1, listings.firstListedCount)
    }
}
