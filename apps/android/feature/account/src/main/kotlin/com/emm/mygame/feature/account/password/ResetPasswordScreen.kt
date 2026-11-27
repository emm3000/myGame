package com.emm.mygame.feature.account.password

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
import com.emm.mygame.feature.account.R
import com.emm.mygame.feature.account.auth.AuthHeader

@Composable
internal fun ResetPasswordScreen(
    state: ResetPasswordUiState,
    onIntent: (ResetPasswordIntent) -> Unit,
    onSignInOpen: () -> Unit,
    onForgotPasswordOpen: () -> Unit,
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
        AuthHeader(title = stringResource(R.string.reset_password_title))
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4)) {
            when (state) {
                is ResetPasswordUiState.Form -> NewPasswordForm(form = state, onIntent = onIntent)
                ResetPasswordUiState.Changed -> PasswordChanged()
                ResetPasswordUiState.LinkRefused -> LinkRefused(onForgotPasswordOpen = onForgotPasswordOpen)
            }
            MyGameTextLink(
                label = stringResource(R.string.reset_password_to_sign_in),
                onClick = onSignInOpen,
                isEnabled = state.canSwitchToSignIn,
            )
        }
    }
}

@Composable
private fun NewPasswordForm(
    form: ResetPasswordUiState.Form,
    onIntent: (ResetPasswordIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val isSending: Boolean = form.status == ResetPasswordUiState.FormStatus.Sending
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameTextField(
            value = form.password,
            label = stringResource(R.string.reset_password_password),
            isSecret = true,
            isReadOnly = isSending,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
            onValueChange = { password: String -> onIntent(ResetPasswordIntent.PasswordChanged(password)) },
            contentType = ContentType.NewPassword,
            supportingText = stringResource(R.string.reset_password_password_hint),
        )
        FormStatusMessage(status = form.status)
        MyGameButton(
            label = stringResource(R.string.reset_password_submit),
            isBusy = isSending,
            busyDescription = stringResource(R.string.reset_password_sending),
            onClick = { onIntent(ResetPasswordIntent.SubmitTapped) },
        )
    }
}

@Composable
private fun FormStatusMessage(status: ResetPasswordUiState.FormStatus, modifier: Modifier = Modifier) {
    when (status) {
        ResetPasswordUiState.FormStatus.Idle, ResetPasswordUiState.FormStatus.Sending -> Unit
        ResetPasswordUiState.FormStatus.WeakPassword ->
            MyGameInlineAlert(message = stringResource(R.string.reset_password_weak_password), modifier = modifier)
        ResetPasswordUiState.FormStatus.Unexpected ->
            MyGameInlineAlert(message = stringResource(R.string.reset_password_unexpected), modifier = modifier)
    }
}

@Composable
private fun PasswordChanged(modifier: Modifier = Modifier) {
    MyGameText(
        text = stringResource(R.string.reset_password_changed),
        style = MyGameTypography.body,
        color = MyGameTheme.colors.ink,
        modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
    )
}

@Composable
private fun LinkRefused(onForgotPasswordOpen: () -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameInlineAlert(message = stringResource(R.string.reset_password_link_refused))
        MyGameTextLink(label = stringResource(R.string.reset_password_new_link), onClick = onForgotPasswordOpen)
    }
}
