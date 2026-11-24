package com.emm.mygame.feature.account.verification

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.feature.account.R
import com.emm.mygame.feature.account.auth.AuthHeader

@Composable
internal fun VerifyEmailScreen(
    state: VerifyEmailUiState,
    onIntent: (VerifyEmailIntent) -> Unit,
    onTownOpen: () -> Unit,
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
        AuthHeader(title = stringResource(R.string.verify_email_title))
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4)) {
            when (state) {
                VerifyEmailUiState.Verifying -> Verifying()
                VerifyEmailUiState.Verified -> Verified(onTownOpen = onTownOpen)
                VerifyEmailUiState.LinkRefused -> LinkRefused(onSignInOpen = onSignInOpen)
                VerifyEmailUiState.Unexpected -> MyGameErrorBanner(
                    message = stringResource(R.string.verify_email_unexpected),
                    actionLabel = stringResource(R.string.verify_email_retry),
                    onAction = { onIntent(VerifyEmailIntent.RetryTapped) },
                )
            }
        }
    }
}

@Composable
private fun Verifying(modifier: Modifier = Modifier) {
    MyGameText(
        text = stringResource(R.string.verify_email_verifying),
        style = MyGameTypography.body,
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
    )
}

@Composable
private fun Verified(onTownOpen: () -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.verify_email_verified),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
        MyGameTextLink(label = stringResource(R.string.verify_email_to_town), onClick = onTownOpen)
    }
}

@Composable
private fun LinkRefused(onSignInOpen: () -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameInlineAlert(message = stringResource(R.string.verify_email_link_refused))
        MyGameTextLink(label = stringResource(R.string.verify_email_to_sign_in), onClick = onSignInOpen)
    }
}
