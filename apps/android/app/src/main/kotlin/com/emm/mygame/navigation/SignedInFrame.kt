package com.emm.mygame.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.FrameKind
import com.emm.mygame.FramedScreen
import com.emm.mygame.InPlayerLanguage
import com.emm.mygame.PlayerLanguageUiState
import com.emm.mygame.PlayerLanguageViewModel
import com.emm.mygame.SignedInChrome

@Composable
internal fun SignedInFrame(
    kind: FrameKind,
    doesScreenReadTown: Boolean,
    chrome: SignedInChrome,
    modifier: Modifier = Modifier,
    frameLanguage: PlayerLanguageViewModel = viewModel { PlayerLanguageViewModel(chrome.dependencies.playerLanguage) },
    content: @Composable () -> Unit,
) {
    val framed: PlayerLanguageUiState by frameLanguage.state.collectAsStateWithLifecycle()
    InPlayerLanguage(language = framed.language) {
        FramedScreen(
            kind = kind,
            doesScreenReadTown = doesScreenReadTown,
            chrome = chrome,
            modifier = modifier,
            content = content,
        )
    }
}
