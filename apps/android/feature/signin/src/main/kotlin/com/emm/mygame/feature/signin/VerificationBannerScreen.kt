package com.emm.mygame.feature.signin

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
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
fun VerificationBannerScreen(
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
            MyGameTextButton(
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

private class VerificationBannerUiStates : PreviewParameterProvider<VerificationBannerUiState> {

    override val values: Sequence<VerificationBannerUiState> = sequenceOf(
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Idle),
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Sending),
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Sent),
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.MailNotSent),
        VerificationBannerUiState.Unverified(VerificationBannerUiState.Resend.Unreachable),
    )
}

@PreviewMyGame
@Composable
private fun VerificationBannerScreenPreview(
    @PreviewParameter(VerificationBannerUiStates::class) state: VerificationBannerUiState,
) {
    MyGamePreviewSurface {
        VerificationBannerScreen(state = state, onIntent = {})
    }
}

@PreviewMyGame
@Composable
private fun VerificationBannerScreenBothPhasePreview(
    @PreviewParameter(VerificationBannerUiStates::class) state: VerificationBannerUiState,
) {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            VerificationBannerScreen(state = state, onIntent = {})
        }
    }
}
