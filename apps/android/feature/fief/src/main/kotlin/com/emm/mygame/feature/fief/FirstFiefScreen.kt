package com.emm.mygame.feature.fief

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
fun FirstFiefScreen(state: FirstFiefUiState, onIntent: (FirstFiefIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .padding(start = MyGameSpacing.step4, end = MyGameSpacing.step4, top = MyGameSpacing.step8),
    ) {
        Header(isSigningOut = state == FirstFiefUiState.SigningOut, onIntent = onIntent)
        when (state) {
            FirstFiefUiState.Loading -> MyGameText(
                text = stringResource(R.string.fief_loading),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
            FirstFiefUiState.NoFief -> MyGameErrorBanner(
                message = stringResource(R.string.first_fief_none),
                actionLabel = stringResource(R.string.fief_retry),
                onAction = { onIntent(FirstFiefIntent.RetryTapped) },
            )
            FirstFiefUiState.Unreachable -> MyGameErrorBanner(
                message = stringResource(R.string.fief_unreachable),
                actionLabel = stringResource(R.string.fief_retry),
                onAction = { onIntent(FirstFiefIntent.RetryTapped) },
            )
            FirstFiefUiState.SigningOut -> Unit
        }
    }
}

@Composable
private fun Header(isSigningOut: Boolean, onIntent: (FirstFiefIntent) -> Unit, modifier: Modifier = Modifier) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = modifier.fillMaxWidth()) {
        MyGameText(
            text = stringResource(R.string.fief_brand),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.action,
            modifier = Modifier.weight(1f).semantics { heading() },
        )
        MyGameTextButton(
            label = stringResource(R.string.sign_out),
            isBusy = isSigningOut,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FirstFiefIntent.SignOutTapped) },
        )
    }
}
