package com.emm.mygame.feature.signin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
fun ForgotPasswordScreen(
    state: ForgotPasswordUiState,
    onIntent: (ForgotPasswordIntent) -> Unit,
    onSignInOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step8),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(start = MyGameSpacing.step4, end = MyGameSpacing.step4, top = MyGameSpacing.step12)
            .padding(bottom = MyGameSpacing.step8),
    ) {
        AuthHeader(title = stringResource(R.string.forgot_password_title))
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4)) {
            when (state) {
                is ForgotPasswordUiState.Form -> RequestForm(form = state, onIntent = onIntent)
                ForgotPasswordUiState.Sent -> Confirmation()
            }
            MyGameTextLink(label = stringResource(R.string.forgot_password_to_sign_in), onClick = onSignInOpen)
        }
    }
}

@Composable
private fun RequestForm(
    form: ForgotPasswordUiState.Form,
    onIntent: (ForgotPasswordIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isSending: Boolean = form.status == ForgotPasswordUiState.FormStatus.Sending
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameTextField(
            value = form.email,
            label = stringResource(R.string.forgot_password_email),
            isSecret = false,
            isReadOnly = isSending,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Done),
            onValueChange = { email: String -> onIntent(ForgotPasswordIntent.EmailChanged(email)) },
            contentType = ContentType.EmailAddress,
        )
        FormStatusMessage(status = form.status)
        MyGameButton(
            label = stringResource(R.string.forgot_password_submit),
            isBusy = isSending,
            busyDescription = stringResource(R.string.forgot_password_sending),
            onClick = { onIntent(ForgotPasswordIntent.SubmitTapped) },
        )
    }
}

@Composable
private fun FormStatusMessage(status: ForgotPasswordUiState.FormStatus, modifier: Modifier = Modifier) {
    when (status) {
        ForgotPasswordUiState.FormStatus.Idle, ForgotPasswordUiState.FormStatus.Sending -> Unit
        ForgotPasswordUiState.FormStatus.MalformedEmail ->
            MyGameInlineAlert(message = stringResource(R.string.forgot_password_malformed_email), modifier = modifier)
        ForgotPasswordUiState.FormStatus.Unexpected ->
            MyGameInlineAlert(message = stringResource(R.string.forgot_password_unexpected), modifier = modifier)
    }
}

@Composable
private fun Confirmation(modifier: Modifier = Modifier) {
    MyGameText(
        text = stringResource(R.string.forgot_password_confirmation),
        style = MyGameTypography.body,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
    )
}
