package com.emm.mygame.feature.signin

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.network.SessionRepository

@Composable
fun VerificationBannerRoute(
    sessions: SessionRepository,
    isSessionOpen: Boolean,
    modifier: Modifier = Modifier,
    viewModel: VerificationBannerViewModel = viewModel { VerificationBannerViewModel(sessions) },
) {
    val state: VerificationBannerUiState by viewModel.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(viewModel, isSessionOpen) {
        val shown: VerificationBannerIntent =
            if (isSessionOpen) VerificationBannerIntent.ScreenShown else VerificationBannerIntent.SessionClosed
        viewModel.onIntent(shown)
        onStopOrDispose { viewModel.onIntent(VerificationBannerIntent.ScreenHidden) }
    }
    VerificationBannerScreen(state = state, onIntent = viewModel::onIntent, modifier = modifier)
}
