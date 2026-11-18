package com.emm.mygame.feature.signin

import com.emm.mygame.core.network.PlayerScaffold
import com.emm.mygame.core.network.RestoreResult
import com.emm.mygame.core.network.SignedInPlayer
import com.emm.mygame.core.network.StudyReminderChoice
import com.emm.mygame.core.network.ThemePick
import com.emm.mygame.core.testing.FakeReminderNotifications
import com.emm.mygame.core.testing.FakeSessionRepository
import com.emm.mygame.core.testing.FakeStudyReminderSettings
import com.emm.mygame.core.testing.FakeThemeSettings
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class SettingsThemeViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    private val sessions: FakeSessionRepository = FakeSessionRepository()

    private fun loaded(themes: FakeThemeSettings): SettingsViewModel {
        sessions.answerRestore(
            RestoreResult.SignedIn(
                SignedInPlayer("ines@example.com", isEmailVerified = true, scaffold = PlayerScaffold.Spanish),
            ),
        )
        return SettingsViewModel(
            sessions = sessions,
            playerScaffold = MutableStateFlow(PlayerScaffold.Spanish),
            reminders = FakeStudyReminderSettings(StudyReminderChoice.firstChoice),
            notifications = FakeReminderNotifications(areAllowed = true, canAsk = true),
            themes = themes,
        )
    }

    private fun themeOf(viewModel: SettingsViewModel): ThemePick? =
        (viewModel.state.value as? SettingsUiState.Loaded)?.theme

    @Test
    fun `draws the stored theme`() = runTest {
        val viewModel: SettingsViewModel = loaded(FakeThemeSettings(ThemePick.Dark))

        assertEquals(ThemePick.Dark, themeOf(viewModel))
    }

    @Test
    fun `stores the picked theme at once`() = runTest {
        val themes: FakeThemeSettings = FakeThemeSettings(ThemePick.System)
        val viewModel: SettingsViewModel = loaded(themes)

        viewModel.onIntent(SettingsIntent.ThemePicked(ThemePick.Light))

        assertEquals(ThemePick.Light, themes.pick.value)
    }

    @Test
    fun `draws the picked theme as chosen`() = runTest {
        val viewModel: SettingsViewModel = loaded(FakeThemeSettings(ThemePick.System))

        viewModel.onIntent(SettingsIntent.ThemePicked(ThemePick.Dark))

        assertEquals(ThemePick.Dark, themeOf(viewModel))
    }

    @Test
    fun `follows a theme stored elsewhere`() = runTest {
        val themes: FakeThemeSettings = FakeThemeSettings(ThemePick.System)
        val viewModel: SettingsViewModel = loaded(themes)

        themes.choose(ThemePick.Light)

        assertEquals(ThemePick.Light, themeOf(viewModel))
    }
}
