package com.emm.mygame

import com.emm.mygame.core.model.account.PlayerChromePhase
import com.emm.mygame.core.model.account.PlayerLanguage
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class PlayerLanguageViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val latestRead: MutableStateFlow<PlayerLanguage?> = MutableStateFlow(null)

    private val spanishScaffold: PlayerLanguage = PlayerLanguage(PlayerScaffold.Spanish, PlayerChromePhase.Scaffold)

    @Test
    fun `keeps the last known language when a read comes back empty`() = runTest {
        latestRead.value = spanishScaffold
        val viewModel: PlayerLanguageViewModel = PlayerLanguageViewModel(latestRead)

        latestRead.value = null
        runCurrent()

        assertEquals(PlayerLanguageUiState(language = spanishScaffold), viewModel.state.value)
    }

    @Test
    fun `keeps a language read after it starts when a later read comes back empty`() = runTest {
        val viewModel: PlayerLanguageViewModel = PlayerLanguageViewModel(latestRead)

        latestRead.value = spanishScaffold
        runCurrent()
        latestRead.value = null
        runCurrent()

        assertEquals(PlayerLanguageUiState(language = spanishScaffold), viewModel.state.value)
    }

    @Test
    fun `forgets the last known language when the session closes`() = runTest {
        latestRead.value = spanishScaffold
        val viewModel: PlayerLanguageViewModel = PlayerLanguageViewModel(latestRead)
        latestRead.value = null
        runCurrent()

        viewModel.onIntent(PlayerLanguageIntent.SessionClosed)
        runCurrent()

        assertEquals(PlayerLanguageUiState(language = null), viewModel.state.value)
    }
}
