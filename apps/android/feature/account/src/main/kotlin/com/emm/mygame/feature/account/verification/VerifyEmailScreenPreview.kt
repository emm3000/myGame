package com.emm.mygame.feature.account.verification

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame

private class VerifyEmailUiStates : PreviewParameterProvider<VerifyEmailUiState> {

    override val values: Sequence<VerifyEmailUiState> = sequenceOf(
        VerifyEmailUiState.Verifying,
        VerifyEmailUiState.Verified,
        VerifyEmailUiState.LinkRefused,
        VerifyEmailUiState.Unexpected,
    )
}

@PreviewMyGame
@Composable
private fun VerifyEmailScreenPreview(@PreviewParameter(VerifyEmailUiStates::class) state: VerifyEmailUiState) {
    MyGamePreviewSurface {
        VerifyEmailScreen(state = state, onIntent = {}, onTownOpen = {}, onSignInOpen = {})
    }
}
