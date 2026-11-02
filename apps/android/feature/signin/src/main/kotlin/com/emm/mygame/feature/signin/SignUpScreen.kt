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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.SignUpRefusal

@Composable
fun SignUpScreen(
    state: SignUpUiState,
    onIntent: (SignUpIntent) -> Unit,
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
        AuthHeader(title = stringResource(R.string.sign_up_title))
        when (state) {
            is SignUpUiState.Form -> SignUpForm(form = state, onIntent = onIntent, onSignInOpen = onSignInOpen)
            SignUpUiState.SignedIn -> MyGameText(
                text = stringResource(R.string.signed_in_title),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
        }
    }
}

@Composable
private fun SignUpForm(
    form: SignUpUiState.Form,
    onIntent: (SignUpIntent) -> Unit,
    onSignInOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val isSubmitting: Boolean = form.status == SignUpUiState.FormStatus.Submitting
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameTextField(
            value = form.email,
            label = stringResource(R.string.sign_in_email),
            isSecret = false,
            isReadOnly = isSubmitting,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
            onValueChange = { email: String -> onIntent(SignUpIntent.EmailChanged(email)) },
        )
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1)) {
            MyGameTextField(
                value = form.password,
                label = stringResource(R.string.sign_in_password),
                isSecret = true,
                isReadOnly = isSubmitting,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next),
                onValueChange = { password: String -> onIntent(SignUpIntent.PasswordChanged(password)) },
            )
            MyGameText(
                text = stringResource(R.string.sign_up_password_hint),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        MyGameTextField(
            value = form.fiefName,
            label = stringResource(R.string.sign_up_fief_name),
            isSecret = false,
            isReadOnly = isSubmitting,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Words,
                keyboardType = KeyboardType.Text,
                imeAction = ImeAction.Done,
            ),
            onValueChange = { fiefName: String -> onIntent(SignUpIntent.FiefNameChanged(fiefName)) },
        )
        SignUpStatusMessage(status = form.status, onIntent = onIntent)
        MyGameButton(
            label = stringResource(R.string.sign_up_submit),
            isBusy = isSubmitting,
            busyDescription = stringResource(R.string.sign_in_submitting),
            onClick = { onIntent(SignUpIntent.SubmitTapped) },
        )
        AuthSwitch(
            prompt = stringResource(R.string.sign_up_switch_prompt),
            linkLabel = stringResource(R.string.sign_up_switch_link),
            onClick = { if (form.canSwitchToSignIn) onSignInOpen() },
        )
    }
}

@Composable
private fun SignUpStatusMessage(
    status: SignUpUiState.FormStatus,
    onIntent: (SignUpIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (status) {
        SignUpUiState.FormStatus.Idle, SignUpUiState.FormStatus.Submitting -> Unit
        is SignUpUiState.FormStatus.Refused ->
            MyGameInlineAlert(message = stringResource(refusalMessageOf(status.refusal)), modifier = modifier)
        SignUpUiState.FormStatus.Unreachable -> MyGameErrorBanner(
            message = stringResource(R.string.sign_in_unreachable),
            actionLabel = stringResource(R.string.sign_in_retry),
            onAction = { onIntent(SignUpIntent.RetryTapped) },
            modifier = modifier,
        )
    }
}

private fun refusalMessageOf(refusal: SignUpRefusal): Int = when (refusal) {
    SignUpRefusal.WeakPassword -> R.string.sign_up_refused_weak_password
    SignUpRefusal.BlankFiefName -> R.string.sign_up_refused_blank_fief_name
    SignUpRefusal.EmailTaken -> R.string.sign_up_refused_email_taken
    SignUpRefusal.MalformedEmail -> R.string.sign_up_refused_malformed_email
    SignUpRefusal.Unrecognized -> R.string.sign_up_refused_unrecognized
}
