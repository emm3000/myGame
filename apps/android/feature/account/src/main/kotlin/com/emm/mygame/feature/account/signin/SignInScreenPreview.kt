package com.emm.mygame.feature.account.signin

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.PreviewMyGame
import com.emm.mygame.core.model.account.RefusalKind

private val previewSignInForm: SignInUiState.Form = SignInUiState.Form(
    email = "ana@example.com",
    password = "maple-hollow",
    status = SignInUiState.FormStatus.Idle,
    isSessionEnded = false,
)

private class SignInUiStates : PreviewParameterProvider<SignInUiState> {

    override val values: Sequence<SignInUiState> = sequenceOf(
        previewSignInForm.copy(email = "", password = ""),
        previewSignInForm,
        previewSignInForm.copy(status = SignInUiState.FormStatus.Submitting),
        previewSignInForm.copy(status = SignInUiState.FormStatus.Refused(RefusalKind.InvalidCredentials)),
        previewSignInForm.copy(status = SignInUiState.FormStatus.Unreachable(SignInUiState.Attempt.SignIn)),
        previewSignInForm.copy(email = "", password = "", isSessionEnded = true),
        SignInUiState.CheckingSession,
    )
}

@PreviewMyGame
@Composable
private fun SignInScreenPreview(@PreviewParameter(SignInUiStates::class) state: SignInUiState) {
    MyGamePreviewSurface {
        SignInScreen(state = state, onIntent = {}, onSignUpOpen = {}, onForgotPasswordOpen = {})
    }
}
