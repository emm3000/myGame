package com.emm.mygame.feature.account.verification

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.control.MyGameInlineAlert
import com.emm.mygame.core.designsystem.control.MyGameTextLink
import com.emm.mygame.core.designsystem.frame.MyGameHairline
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.feature.account.R

@Composable
internal fun VerificationBannerScreen(
    state: VerificationBannerUiState,
    onIntent: (VerificationBannerIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (state) {
        VerificationBannerUiState.Hidden -> Unit
        is VerificationBannerUiState.Unverified ->
            Banner(resend = state.resend, onIntent = onIntent, modifier = modifier)
    }
}

@Composable
private fun Banner(
    resend: VerificationBannerUiState.Resend,
    onIntent: (VerificationBannerIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth().background(MyGameTheme.colors.surface)) {
        MyGameHairline()
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            modifier = Modifier
                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Horizontal))
                .padding(horizontal = MyGameSpacing.step4),
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
                modifier = Modifier.weight(1f).padding(vertical = MyGameSpacing.step2),
            ) {
                MyGameText(
                    text = fixedCopyResource(R.string.verification_banner_line),
                    style = MyGameTypography.caption,
                    color = MyGameTheme.colors.inkMuted,
                )
                ResendOutcome(resend = resend)
            }
            MyGameTextLink(
                label = fixedCopyResource(R.string.verification_banner_resend),
                isBusy = resend == VerificationBannerUiState.Resend.Sending,
                busyDescription = fixedCopyResource(R.string.verification_banner_sending),
                onClick = { onIntent(VerificationBannerIntent.ResendTapped) },
            )
        }
    }
}

@Composable
private fun ResendOutcome(resend: VerificationBannerUiState.Resend, modifier: Modifier = Modifier) {
    when (resend) {
        VerificationBannerUiState.Resend.Idle, VerificationBannerUiState.Resend.Sending -> Unit
        VerificationBannerUiState.Resend.Sent -> MyGameText(
            text = fixedCopyResource(R.string.verification_banner_sent),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.ink,
            modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
        )
        VerificationBannerUiState.Resend.MailNotSent -> MyGameInlineAlert(
            message = fixedCopyResource(R.string.verification_refusal_mail_not_sent),
            modifier = modifier,
        )
        VerificationBannerUiState.Resend.Unreachable -> MyGameInlineAlert(
            message = fixedCopyResource(R.string.verification_banner_unreachable),
            modifier = modifier,
        )
    }
}
