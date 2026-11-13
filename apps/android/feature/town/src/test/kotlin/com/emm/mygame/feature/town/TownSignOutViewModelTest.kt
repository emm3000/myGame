package com.emm.mygame.feature.town

import app.cash.turbine.test
import com.emm.mygame.core.network.TownFoundResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class TownSignOutViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val towns: FakeTownRepository = FakeTownRepository()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private fun TestScope.townAnswering(answer: TownReadResult): TownViewModel {
        towns.answerRead(answer)
        val viewModel: TownViewModel = townViewModelOf(towns, readInstant, sessions)
        runCurrent()
        return viewModel
    }

    @Test
    fun `signs out from the naming form`() = runTest {
        val viewModel: TownViewModel = townAnswering(TownReadResult.NoTown)
        sessions.answerSignOut()

        viewModel.effects.test {
            viewModel.onIntent(TownIntent.SignOutTapped)

            assertEquals(TownEffect.SigningOut, awaitItem())
            assertEquals(TownEffect.SignedOut, awaitItem())
        }
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `tells the route it is signing out once however often sign-out is tapped`() = runTest {
        val viewModel: TownViewModel = townAnswering(TownReadResult.NoTown)

        viewModel.effects.test {
            viewModel.onIntent(TownIntent.SignOutTapped)
            viewModel.onIntent(TownIntent.SignOutTapped)
            runCurrent()

            assertEquals(TownEffect.SigningOut, awaitItem())
            expectNoEvents()
        }
    }

    @Test
    fun `signs out from a failed town read`() = runTest {
        val viewModel: TownViewModel = townAnswering(TownReadResult.Unreachable)
        sessions.answerSignOut()

        viewModel.effects.test {
            viewModel.onIntent(TownIntent.SignOutTapped)

            assertEquals(TownEffect.SigningOut, awaitItem())
            assertEquals(TownEffect.SignedOut, awaitItem())
        }
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `draws signing out while the session ends`() = runTest {
        val viewModel: TownViewModel = townAnswering(TownReadResult.NoTown)

        viewModel.onIntent(TownIntent.SignOutTapped)

        assertEquals(TownUiState.SigningOut, viewModel.state.value)
    }

    @Test
    fun `tells the route once that it is signing out until the session has ended`() = runTest {
        val viewModel: TownViewModel = townAnswering(TownReadResult.NoTown)

        viewModel.effects.test {
            viewModel.onIntent(TownIntent.SignOutTapped)
            runCurrent()

            assertEquals(TownEffect.SigningOut, awaitItem())
            expectNoEvents()
        }
    }

    @Test
    fun `ignores every tap while signing out`() = runTest {
        val viewModel: TownViewModel = townAnswering(TownReadResult.NoTown)
        viewModel.onIntent(TownIntent.NameChanged("Riverton"))
        viewModel.onIntent(TownIntent.SignOutTapped)

        viewModel.onIntent(TownIntent.GoToTownTapped)
        viewModel.onIntent(TownIntent.RetryTapped)
        viewModel.onIntent(TownIntent.NameSubmitted)
        viewModel.onIntent(TownIntent.SignOutTapped)
        runCurrent()

        assertEquals(1, towns.readCount)
        assertEquals(emptyList<String>(), towns.foundings)
        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `keeps signing out when a founding lands late`() = runTest {
        val viewModel: TownViewModel = townAnswering(TownReadResult.NoTown)
        viewModel.onIntent(TownIntent.NameChanged("Riverton"))
        viewModel.onIntent(TownIntent.NameSubmitted)
        runCurrent()
        viewModel.onIntent(TownIntent.SignOutTapped)

        towns.answerFound(TownFoundResult.Founded(townOf()))
        runCurrent()

        assertEquals(TownUiState.SigningOut, viewModel.state.value)
    }
}
