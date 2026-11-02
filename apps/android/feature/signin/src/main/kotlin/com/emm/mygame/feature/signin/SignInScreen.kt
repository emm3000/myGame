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
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextField
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.RefusalKind

@Composable
fun SignInScreen(state: SignInUiState, onIntent: (SignInIntent) -> Unit, modifier: Modifier = Modifier) {
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
        when (state) {
            SignInUiState.CheckingSession -> CheckingSession()
            is SignInUiState.Form -> SignInForm(form = state, onIntent = onIntent)
            is SignInUiState.SignedIn -> SignedIn(email = state.email)
        }
    }
}

@Composable
private fun Header(title: String, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.sign_in_brand),
            style = MyGameTypography.brand,
            color = MyGameTheme.colors.umber,
        )
        MyGameText(
            text = title,
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
    }
}

@Composable
private fun CheckingSession(modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step8), modifier = modifier) {
        Header(title = stringResource(R.string.sign_in_title))
        MyGameText(
            text = stringResource(R.string.sign_in_checking_session),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun SignedIn(email: String, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step8), modifier = modifier) {
        Header(title = stringResource(R.string.signed_in_title))
        MyGameText(
            text = stringResource(R.string.signed_in_as, email),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
    }
}

@Composable
private fun SignInForm(form: SignInUiState.Form, onIntent: (SignInIntent) -> Unit, modifier: Modifier = Modifier) {
    val isSubmitting: Boolean = form.status == SignInUiState.FormStatus.Submitting
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step8), modifier = modifier) {
        Header(title = stringResource(R.string.sign_in_title))
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4)) {
            MyGameTextField(
                value = form.email,
                label = stringResource(R.string.sign_in_email),
                isSecret = false,
                isReadOnly = isSubmitting,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                onValueChange = { email: String -> onIntent(SignInIntent.EmailChanged(email)) },
            )
            MyGameTextField(
                value = form.password,
                label = stringResource(R.string.sign_in_password),
                isSecret = true,
                isReadOnly = isSubmitting,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                onValueChange = { password: String -> onIntent(SignInIntent.PasswordChanged(password)) },
            )
            FormStatusMessage(status = form.status, onIntent = onIntent)
            MyGameButton(
                label = stringResource(R.string.sign_in_submit),
                isBusy = isSubmitting,
                busyDescription = stringResource(R.string.sign_in_submitting),
                onClick = { onIntent(SignInIntent.SubmitTapped) },
            )
        }
    }
}

@Composable
private fun FormStatusMessage(
    status: SignInUiState.FormStatus,
    onIntent: (SignInIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (status) {
        SignInUiState.FormStatus.Idle, SignInUiState.FormStatus.Submitting -> Unit
        is SignInUiState.FormStatus.Refused ->
            MyGameInlineAlert(message = stringResource(refusalMessageOf(status.kind)), modifier = modifier)
        is SignInUiState.FormStatus.Unreachable -> MyGameErrorBanner(
            message = stringResource(R.string.sign_in_unreachable),
            actionLabel = stringResource(R.string.sign_in_retry),
            onAction = { onIntent(SignInIntent.RetryTapped) },
            modifier = modifier,
        )
    }
}

private fun refusalMessageOf(kind: RefusalKind): Int = when (kind) {
    RefusalKind.InvalidCredentials -> R.string.sign_in_refused_invalid_credentials
    RefusalKind.Unrecognized -> R.string.sign_in_refused_unrecognized
}
