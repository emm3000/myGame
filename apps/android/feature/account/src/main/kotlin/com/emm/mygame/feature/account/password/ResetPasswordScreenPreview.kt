package com.emm.mygame.feature.account.password

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame

private val previewNewPasswordForm: ResetPasswordUiState.Form = ResetPasswordUiState.Form(
    password = "hierro-y-lana",
    status = ResetPasswordUiState.FormStatus.Idle,
)

private class ResetPasswordUiStates : PreviewParameterProvider<ResetPasswordUiState> {

    override val values: Sequence<ResetPasswordUiState> = sequenceOf(
        previewNewPasswordForm.copy(password = ""),
        previewNewPasswordForm,
        previewNewPasswordForm.copy(status = ResetPasswordUiState.FormStatus.Sending),
        previewNewPasswordForm.copy(password = "corta", status = ResetPasswordUiState.FormStatus.WeakPassword),
        previewNewPasswordForm.copy(status = ResetPasswordUiState.FormStatus.Unexpected),
        ResetPasswordUiState.Changed,
        ResetPasswordUiState.LinkRefused,
    )
}

@PreviewMyGame
@Composable
private fun ResetPasswordScreenPreview(
    @PreviewParameter(ResetPasswordUiStates::class) state: ResetPasswordUiState,
) {
    MyGamePreviewSurface {
        ResetPasswordScreen(state = state, onIntent = {}, onSignInOpen = {}, onForgotPasswordOpen = {})
    }
}
