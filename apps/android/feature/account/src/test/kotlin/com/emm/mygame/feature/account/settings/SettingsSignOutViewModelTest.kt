package com.emm.mygame.feature.account.settings

import app.cash.turbine.test
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.RestoreResult
import com.emm.mygame.core.model.account.SignedInPlayer
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeReportRepository
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SettingsSignOutViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val offReminder: FakeStudyReminderSettings = FakeStudyReminderSettings(StudyReminderChoice.firstChoice)

    private fun settingsOf(): SettingsViewModel = SettingsViewModel(
        sessions,
        MutableStateFlow(PlayerScaffold.Spanish),
        offReminder,
        FakeReminderNotifications(areAllowed = true, canAsk = true),
        FakeReportRepository(),
    )

    private fun loadedSettings(): SettingsViewModel {
        sessions.answerRestore(RestoreResult.SignedIn(SignedInPlayer("ines@example.com", true, PlayerScaffold.Spanish)))
        return settingsOf()
    }

    @Test
    fun `tells the route once that it is signing out while the session ends`() = runTest {
        val viewModel: SettingsViewModel = loadedSettings()

        viewModel.effects.test {
            viewModel.onIntent(SettingsIntent.SignOutTapped)

            assertEquals(SettingsEffect.SigningOut, awaitItem())
            expectNoEvents()
        }
    }

    @Test
    fun `tells the route it is signing out once however often sign-out is tapped`() = runTest {
        val viewModel: SettingsViewModel = loadedSettings()

        viewModel.effects.test {
            viewModel.onIntent(SettingsIntent.SignOutTapped)
            viewModel.onIntent(SettingsIntent.SignOutTapped)
            runCurrent()

            assertEquals(SettingsEffect.SigningOut, awaitItem())
            expectNoEvents()
        }
    }

    @Test
    fun `signs out and tells the route`() = runTest {
        val viewModel: SettingsViewModel = loadedSettings()
        sessions.answerSignOut()

        viewModel.effects.test {
            viewModel.onIntent(SettingsIntent.SignOutTapped)

            assertEquals(SettingsEffect.SigningOut, awaitItem())
            assertEquals(SettingsEffect.SignedOut, awaitItem())
        }
    }

    @Test
    fun `keeps the read settings while the session ends`() = runTest {
        val viewModel: SettingsViewModel = loadedSettings()
        val read: SettingsUiState = viewModel.state.value

        viewModel.onIntent(SettingsIntent.SignOutTapped)

        assertEquals(SettingsUiState.SigningOut(kept = read as SettingsUiState.Loaded), viewModel.state.value)
    }

    @Test
    fun `ignores every tap while signing out`() = runTest {
        val viewModel: SettingsViewModel = loadedSettings()
        viewModel.onIntent(SettingsIntent.SignOutTapped)

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))
        runCurrent()

        assertEquals(emptyList<PlayerScaffold>(), sessions.scaffoldChanges)
    }

    @Test
    fun `keeps signing out when the session read lands late`() = runTest {
        val viewModel: SettingsViewModel = settingsOf()
        viewModel.onIntent(SettingsIntent.SignOutTapped)

        sessions.answerRestore(RestoreResult.SignedIn(SignedInPlayer("ines@example.com", true, PlayerScaffold.Spanish)))
        runCurrent()

        assertEquals(SettingsUiState.SigningOut(kept = null), viewModel.state.value)
    }

    @Test
    fun `keeps signing out when the reminder changes`() = runTest {
        val viewModel: SettingsViewModel = loadedSettings()
        viewModel.onIntent(SettingsIntent.SignOutTapped)
        val signingOut: SettingsUiState = viewModel.state.value

        offReminder.choose(StudyReminderChoice.firstChoice.copy(isOn = true))
        runCurrent()

        assertEquals(signingOut, viewModel.state.value)
    }
}
