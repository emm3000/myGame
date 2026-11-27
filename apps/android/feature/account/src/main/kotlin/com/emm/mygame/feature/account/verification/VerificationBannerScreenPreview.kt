package com.emm.mygame.feature.account.verification

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.PreviewMyGame
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage

private class VerificationBannerUiStates : PreviewParameterProvider<VerificationBannerUiState> {

    override val values: Sequence<VerificationBannerUiState> = sequenceOf(
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Idle),
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Sending),
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Sent),
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.MailNotSent),
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Unreachable),
    )
}

@PreviewMyGame
@Composable
private fun VerificationBannerScreenPreview(
    @PreviewParameter(VerificationBannerUiStates::class) state: VerificationBannerUiState,
) {
    MyGamePreviewSurface {
        VerificationBannerScreen(state = state, onIntent = {})
    }
}

@PreviewMyGame
@Composable
private fun VerificationBannerScreenBothPhasePreview(
    @PreviewParameter(VerificationBannerUiStates::class) state: VerificationBannerUiState,
) {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            VerificationBannerScreen(state = state, onIntent = {})
        }
    }
}
