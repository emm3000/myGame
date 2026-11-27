package com.emm.mygame.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.AppDependencies
import com.emm.mygame.InPlayerLanguage
import com.emm.mygame.PlayerLanguageUiState
import com.emm.mygame.PlayerLanguageViewModel
import com.emm.mygame.feature.shell.FrameKind
import com.emm.mygame.feature.shell.FramedScreen
import com.emm.mygame.feature.shell.ShellNavigation

@Composable
internal fun SignedInFrame(
    kind: FrameKind,
    dependencies: AppDependencies,
    navigator: Navigator,
    modifier: Modifier = Modifier,
    frameLanguage: PlayerLanguageViewModel = viewModel { PlayerLanguageViewModel(dependencies.playerLanguage) },
    content: @Composable () -> Unit,
) {
    val framed: PlayerLanguageUiState by frameLanguage.state.collectAsStateWithLifecycle()
    InPlayerLanguage(language = framed.language) {
        FramedScreen(
            kind = kind,
            towns = dependencies.towns,
            navigation = shellNavigationOf(navigator),
            modifier = modifier,
            content = content,
        )
    }
}

private fun shellNavigationOf(navigator: Navigator): ShellNavigation = ShellNavigation(
    tabUnder = navigator.tabUnder,
    isOnTabRoot = navigator.isOnTabRoot,
    areLinksEnabled = navigator.areLinksEnabled,
    onTabOpen = navigator::openTab,
)
