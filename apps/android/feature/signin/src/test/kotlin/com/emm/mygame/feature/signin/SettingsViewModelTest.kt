package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.ScaffoldChangeResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SettingsViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    @Test
    fun `draws loading until the session is read`() = runTest {
        val viewModel: SettingsViewModel = SettingsViewModel(sessions)

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

        val viewModel: SettingsViewModel = SettingsViewModel(sessions)

        assertEquals(SettingsUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `draws failed when the session names a scaffold the client does not know`() = runTest {
        sessions.answerRestore(sessionWith(scaffold = null))

        val viewModel: SettingsViewModel = SettingsViewModel(sessions)

        assertEquals(SettingsUiState.Failed, viewModel.state.value)
    }

    @Test
    fun `reads the session again on retry`() = runTest {
        sessions.answerRestore(RestoreResult.Unreachable)
        val viewModel: SettingsViewModel = SettingsViewModel(sessions)
        sessions.answerRestore(sessionWith(scaffold = PlayerScaffold.None))

        viewModel.onIntent(SettingsIntent.RetryTapped)

        assertEquals(stored(PlayerScaffold.None), viewModel.state.value)
    }

    @Test
    fun `draws the pick as saving while the api answers`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)

        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Saving(PlayerScaffold.None)),
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
    fun `stores the scaffold the api answers`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(PlayerScaffold.None)))

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.None, SettingsUiState.Change.Saved),
            viewModel.state.value,
        )
    }

    @Test
    fun `returns to the stored value on a refusal`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        sessions.answerScaffoldChange(ScaffoldChangeResult.Refused)

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Refused),
            viewModel.state.value,
        )
    }

    @Test
    fun `returns to the stored value when the api cannot be reached`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        sessions.answerScaffoldChange(ScaffoldChangeResult.Unreachable)

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Unreachable),
            viewModel.state.value,
        )
    }

    @Test
    fun `returns to the stored value when the api answers a scaffold the client does not know`() = runTest {
        val viewModel: SettingsViewModel = loaded(PlayerScaffold.Spanish)
        viewModel.onIntent(SettingsIntent.ScaffoldPicked(PlayerScaffold.None))

        sessions.answerScaffoldChange(ScaffoldChangeResult.Changed(playerWith(scaffold = null)))

        assertEquals(
            SettingsUiState.Loaded(PlayerScaffold.Spanish, SettingsUiState.Change.Unreachable),
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

    private fun loaded(scaffold: PlayerScaffold): SettingsViewModel {
        sessions.answerRestore(sessionWith(scaffold))
        return SettingsViewModel(sessions)
    }

    private fun stored(scaffold: PlayerScaffold): SettingsUiState =
        SettingsUiState.Loaded(scaffold, SettingsUiState.Change.Untouched)

    private fun sessionWith(scaffold: PlayerScaffold?): RestoreResult = RestoreResult.SignedIn(playerWith(scaffold))

    private fun playerWith(scaffold: PlayerScaffold?): SignedInPlayer =
        SignedInPlayer(email = "ines@sotoverde.es", isEmailVerified = true, scaffold = scaffold)
}
