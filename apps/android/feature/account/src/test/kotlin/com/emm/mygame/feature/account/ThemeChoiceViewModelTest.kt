package com.emm.mygame.feature.account

import com.emm.mygame.core.model.theme.ThemePick
import com.emm.mygame.core.testing.FakeThemeSettings
import com.emm.mygame.core.testing.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class ThemeChoiceViewModelTest {

    @get:Rule
    val mainDispatcher: MainDispatcherRule = MainDispatcherRule()

    @Test
    fun `draws the stored theme`() = runTest {
        val viewModel: ThemeChoiceViewModel = ThemeChoiceViewModel(FakeThemeSettings(ThemePick.Dark))

        assertEquals(ThemeChoiceUiState(ThemePick.Dark), viewModel.state.value)
    }

    @Test
    fun `stores the picked theme at once`() = runTest {
        val themes: FakeThemeSettings = FakeThemeSettings(ThemePick.System)
        val viewModel: ThemeChoiceViewModel = ThemeChoiceViewModel(themes)

        viewModel.onIntent(ThemeChoiceIntent.Picked(ThemePick.Light))

        assertEquals(ThemePick.Light, themes.pick.value)
    }

    @Test
    fun `draws the picked theme as chosen`() = runTest {
        val viewModel: ThemeChoiceViewModel = ThemeChoiceViewModel(FakeThemeSettings(ThemePick.System))

        viewModel.onIntent(ThemeChoiceIntent.Picked(ThemePick.Dark))

        assertEquals(ThemeChoiceUiState(ThemePick.Dark), viewModel.state.value)
    }

    @Test
    fun `follows a theme stored elsewhere`() = runTest {
        val themes: FakeThemeSettings = FakeThemeSettings(ThemePick.System)
        val viewModel: ThemeChoiceViewModel = ThemeChoiceViewModel(themes)

        themes.choose(ThemePick.Light)

        assertEquals(ThemeChoiceUiState(ThemePick.Light), viewModel.state.value)
    }
}
