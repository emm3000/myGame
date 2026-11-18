package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.ScaffoldChangeResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SettingsViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private val playerScaffold: MutableStateFlow<PlayerScaffold?> = MutableStateFlow(null)

    private val reminders: FakeStudyReminderSettings = FakeStudyReminderSettings(StudyReminderChoice.firstChoice)

    private val notifications: FakeReminderNotifications = FakeReminderNotifications(areAllowed = false, canAsk = true)

    @Test
    fun `draws loading until the session is read`() = runTest {
        val viewModel: SettingsViewModel = SettingsViewModel(sessions, playerScaffold, reminders, notifications)

        assertEquals(SettingsUiState.Loading, viewModel.state.value)
    }

    @Test
    fun `draws the stored scaffold`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)

        assertEquals(stored(PlayerScaffold.Spanish), viewModel.state.value)
    }

    @Test
    fun `draws failed when the session cannot be read`() = runTest {
        sessions.answerRestore(RestoreResult.Unreachable)

        val viewModel: SettingsViewModel = SettingsViewModel(sessions, playerScaffold, reminders, notifications)

        assertEquals(SettingsUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `draws failed when the session names a scaffold the client does not know`() = runTest {
        sessions.answerRestore(sessionWith(scaffold = null))

        val viewModel: SettingsViewModel = SettingsViewModel(sessions, playerScaffold, reminders, notifications)

        assertEquals(SettingsUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads the session again on retry`() = runTest {
        sessions.answerRestore(RestoreResult.Unreachable)
        val viewModel: SettingsViewModel = SettingsViewModel(sessions, playerScaffold, reminders, notifications)
        sessions.answerRestore(sessionWith(scaffold = PlayerScaffold.None))

        viewModel.onIntent(SettingsIntent.RetryTapped)

        assertEquals(stored(PlayerScaffold.None), viewModel.state.value)
    }

    @Test
    fun `draws the pick as saving while the api answers`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        assertEquals(
            SettingsUiState.Loaded(
                PlayerScaffold.Spanish,
                SettingsUiState.Change.Saving(PlayerScaffold.None),
                firstReminder,
            ),
            viewModel.state.value,
        )
    }

    @Test
    fun `sends the pick once`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.Spanish))
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        assertEquals(listOf(PlayerScaffold.None), sessions.scaffoldChanges)
    }

    @Test
    fun `sends nothing for the scaffold already stored`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.Spanish))

        assertEquals(emptyList<PlayerScaffold>(), sessions.scaffoldChanges)
    }

    @Test
    fun `draws the scaffold the app holds once the change answers`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))
        playerScaffold.value = PlayerScaffold.None

        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(PlayerScaffold.None)))

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Saved, firstReminder),
            viewModel.state.value,
        )
    }

    @Test
    fun `returns to the stored value on a refusal`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        sessions.answerScaffoldChange(ScaffoldChangeResult.Refused)

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Refused, firstReminder),
            viewModel.state.value,
        )
    }

    @Test
    fun `returns to the stored value when the api cannot be reached`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        sessions.answerScaffoldChange(ScaffoldChangeResult.Unreachable)

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Unreachable, firstReminder),
            viewModel.state.value,
        )
    }

    @Test
    fun `returns to the stored value when the api answers a scaffold the client does not know`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(scaffold = null)))

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Unreachable, firstReminder),
            viewModel.state.value,
        )
    }

    @Test
    fun `sends a new pick once the last one is answered`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))
        sessions.answerScaffoldChange(ScaffoldChangeResult.Unreachable)

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        assertEquals(listOf(PlayerScaffold.None, PlayerScaffold.None), sessions.scaffoldChanges)
    }

    @Test
    fun `draws the scaffold the app holds when the session read answers an older one`() = runTest {
        playerScaffold.value = PlayerScaffold.Spanish

        val viewModel: SettingsViewModel = loaded(PlayerScaffold.None)

        assertEquals(stored(PlayerScaffold.Spanish), viewModel.state.value)
    }

    @Test
    fun `draws a held change that answers after the session read sent after it`() = runTest {
        playerScaffold.value = PlayerScaffold.None
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.None)

        playerScaffold.value = PlayerScaffold.Spanish

        assertEquals(stored(PlayerScaffold.Spanish), viewModel.state.value)
    }

    @Test
    fun `sends the scaffold the session read named once a held change answers with the other`() = runTest {
        playerScaffold.value = PlayerScaffold.None
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.None)
        playerScaffold.value = PlayerScaffold.Spanish

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        assertEquals(listOf(PlayerScaffold.None), sessions.scaffoldChanges)
    }

    @Test
    fun `draws the scaffold the app holds when the change answers an older one`() = runTest {
        playerScaffold.value = PlayerScaffold.None
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.None)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.Spanish))
        playerScaffold.value = PlayerScaffold.Spanish
        playerScaffold.value = PlayerScaffold.None

        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(PlayerScaffold.Spanish)))

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Saved, firstReminder),
            viewModel.state.value,
        )
    }

    @Test
    fun `sends the other scaffold after the change answers an older one than the app holds`() = runTest {
        playerScaffold.value = PlayerScaffold.None
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.None)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.Spanish))
        playerScaffold.value = PlayerScaffold.Spanish
        playerScaffold.value = PlayerScaffold.None
        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(PlayerScaffold.Spanish)))

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.Spanish))

        assertEquals(listOf(PlayerScaffold.Spanish, PlayerScaffold.Spanish), sessions.scaffoldChanges)
    }

    @Test
    fun `draws the scaffold the app holds when the change it already committed cannot be answered`() = runTest {
        playerScaffold.value = PlayerScaffold.Spanish
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))
        playerScaffold.value = PlayerScaffold.None

        sessions.answerScaffoldChange(ScaffoldChangeResult.Unreachable)

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Unreachable, firstReminder),
            viewModel.state.value,
        )
    }

    @Test
    fun `sends the other scaffold after a change the app already holds cannot be answered`() = runTest {
        playerScaffold.value = PlayerScaffold.Spanish
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))
        playerScaffold.value = PlayerScaffold.None
        sessions.answerScaffoldChange(ScaffoldChangeResult.Unreachable)

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.Spanish))

        assertEquals(listOf(PlayerScaffold.None, PlayerScaffold.Spanish), sessions.scaffoldChanges)
    }

    private fun loaded(scaffold: PlayerScaffold): SettingsViewModel {
        sessions.answerRestore(sessionWith(scaffold))
        return SettingsViewModel(sessions, playerScaffold, reminders, notifications)
    }

    private fun stored(scaffold: PlayerScaffold): SettingsUiState =
        SettingsUiState.Loaded(scaffold, SettingsUiState.Change.Untouched, firstReminder)

    private fun sessionWith(scaffold: PlayerScaffold?): RestoreResult = RestoreResult.SignedIn(playerWith(scaffold))

    private fun playerWith(scaffold: PlayerScaffold?): SignedInPlayer =
        SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = true, scaffold = scaffold)
}
