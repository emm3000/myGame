package com.emm.mygame.feature.account.password

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

private val previewForgotForm: ForgotPasswordUiState.Form = ForgotPasswordUiState.Form(
    email = "ana@example.com",
    status = ForgotPasswordUiState.FormStatus.Idle,
)

private class ForgotPasswordUiStates : PreviewParameterProvider<ForgotPasswordUiState> {

    override val values: Sequence<ForgotPasswordUiState> = sequenceOf(
        previewForgotForm.copy(email = ""),
        previewForgotForm,
        previewForgotForm.copy(status = ForgotPasswordUiState.FormStatus.Sending),
        previewForgotForm.copy(email = "ana@", status = ForgotPasswordUiState.FormStatus.MalformedEmail),
        previewForgotForm.copy(status = ForgotPasswordUiState.FormStatus.Unexpected),
        ForgotPasswordUiState.Sent,
    )
}

@PreviewMyGame
@Composable
private fun ForgotPasswordScreenPreview(
    @PreviewParameter(ForgotPasswordUiStates::class) state: ForgotPasswordUiState,
) {
    MyGamePreviewSurface {
        ForgotPasswordScreen(state = state, onIntent = {}, onSignInOpen = {})
    }
}
