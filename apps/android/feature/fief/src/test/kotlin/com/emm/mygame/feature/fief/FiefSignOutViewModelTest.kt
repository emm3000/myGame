package com.emm.mygame.feature.fief

import app.cash.turbine.test
import com.emm.mygame.core.network.BuildingKind
import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.UpgradeResult
import com.emm.mygame.core.testing.FakeFiefRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class FiefSignOutViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `asks the api to sign out when the lord taps sign out`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: FiefViewModel = openFief(FakeFiefRepository(), sessions = sessions)

        viewModel.onIntent(FiefIntent.SignOutTapped)
        runCurrent()

        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `asks the api to sign out once however often the lord taps`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: FiefViewModel = openFief(FakeFiefRepository(), sessions = sessions)

        viewModel.onIntent(FiefIntent.SignOutTapped)
        viewModel.onIntent(FiefIntent.SignOutTapped)
        runCurrent()

        assertEquals(1, sessions.signOutCount)
    }

    @Test
    fun `hides the fief while the sign-out waits on the api`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)

        viewModel.state.test {
            fiefs.answerRead(FiefReadResult.Read(fief()))
            awaitContent()
            viewModel.onIntent(FiefIntent.SignOutTapped)

            assertEquals(FiefUiState.SigningOut, awaitItem())
        }
    }

    @Test
    fun `goes to sign-in once the sign-out is done`() = runTest {
        val sessions: FakeSessionRepository = FakeSessionRepository()
        val viewModel: FiefViewModel = openFief(FakeFiefRepository(), sessions = sessions)

        viewModel.effects.test {
            viewModel.onIntent(FiefIntent.SignOutTapped)
            sessions.answerSignOut()

            assertEquals(FiefEffect.SignedOut, awaitItem())
        }
    }

    @Test
    fun `drops the answer of a read in flight when signing out`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)

        viewModel.state.test {
            assertEquals(FiefUiState.Loading, awaitItem())
            viewModel.onIntent(FiefIntent.SignOutTapped)
            assertEquals(FiefUiState.SigningOut, awaitItem())

            fiefs.answerRead(FiefReadResult.Read(fief()))
            runCurrent()

            expectNoEvents()
        }
    }

    @Test
    fun `reads the fief no more after signing out`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief(slot = busySlot(finishesIn = 1.seconds))))
        runCurrent()

        viewModel.onIntent(FiefIntent.SignOutTapped)
        advanceTimeBy(10.minutes)

        assertEquals(1, fiefs.readCount)
    }

    @Test
    fun `drops the answer of an upgrade in flight when signing out`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)

        viewModel.state.test {
            fiefs.answerRead(FiefReadResult.Read(fief()))
            awaitContent()
            viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
            awaitContentWhere { content: FiefUiState.Content -> content.upgrade is FiefUiState.UpgradeStatus.Waiting }
            viewModel.onIntent(FiefIntent.SignOutTapped)
            assertEquals(FiefUiState.SigningOut, awaitItem())

            fiefs.answerUpgrade(UpgradeResult.Upgraded(fief(slot = busySlot(finishesIn = 1.seconds))))
            advanceTimeBy(10.minutes)

            expectNoEvents()
        }
    }

    @Test
    fun `sends no upgrade once the sign-out is tapped`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Read(fief()))
        runCurrent()

        viewModel.onIntent(FiefIntent.SignOutTapped)
        viewModel.onIntent(FiefIntent.UpgradeTapped(BuildingKind.Sawmill))
        runCurrent()

        assertEquals(emptyList<Any>(), fiefs.upgrades)
    }

    @Test
    fun `reads the fief no more when retry is tapped after signing out`() = runTest {
        val fiefs: FakeFiefRepository = FakeFiefRepository()
        val viewModel: FiefViewModel = openFief(fiefs)
        fiefs.answerRead(FiefReadResult.Unreachable)
        runCurrent()

        viewModel.onIntent(FiefIntent.SignOutTapped)
        viewModel.onIntent(FiefIntent.RetryTapped)
        runCurrent()

        assertEquals(1, fiefs.readCount)
    }
}
