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
import com.emm.mygame.ScreenFrame
import com.emm.mygame.SignedInChrome
import com.emm.mygame.core.designsystem.MyGameDockGo

@Composable
internal fun SignedInFrame(
    kind: FrameKind,
    doesScreenReadTown: Boolean,
    chrome: SignedInChrome,
    modifier: Modifier = Modifier,
    isDockWithheld: Boolean = false,
    studyInPlace: @Composable (Int) -> MyGameDockGo? = { null },
    frameLanguage: PlayerLanguageViewModel = viewModel { PlayerLanguageViewModel(chrome.dependencies.playerLanguage) },
    content: @Composable (ScreenFrame) -> Unit,
) {
    val framed: PlayerLanguageUiState by frameLanguage.state.collectAsStateWithLifecycle()
    InPlayerLanguage(language = framed.language) {
        FramedScreen(
            kind = kind,
            doesScreenReadTown = doesScreenReadTown,
            chrome = chrome,
            modifier = modifier,
            isDockWithheld = isDockWithheld,
            studyInPlace = studyInPlace,
            content = content,
        )
    }
}
