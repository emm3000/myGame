package com.emm.mygame.feature.account.signup

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.account.PlayerScaffold
import com.emm.mygame.core.model.account.SignUpRefusal

private val previewSignUpForm: SignUpUiState.Form = SignUpUiState.Form(
    scaffold = PlayerScaffold.Spanish,
    email = "ana@example.com",
    password = "maple-hollow",
    status = SignUpUiState.FormStatus.Idle,
)

private class SignUpUiStates : PreviewParameterProvider<SignUpUiState> {

    override val values: Sequence<SignUpUiState> = sequenceOf(
        previewSignUpForm.copy(email = "", password = ""),
        previewSignUpForm.copy(scaffold = PlayerScaffold.None, email = "", password = ""),
        previewSignUpForm.copy(scaffold = PlayerScaffold.None),
        previewSignUpForm.copy(status = SignUpUiState.FormStatus.Submitting),
        previewSignUpForm.copy(status = SignUpUiState.FormStatus.Refused(SignUpRefusal.EmailTaken)),
        previewSignUpForm.copy(status = SignUpUiState.FormStatus.Unreachable),
    )
}

@PreviewMyGame
@Composable
private fun SignUpScreenPreview(@PreviewParameter(SignUpUiStates::class) state: SignUpUiState) {
    MyGamePreviewSurface {
        SignUpScreen(state = state, onIntent = {}, onSignInOpen = {})
    }
}
