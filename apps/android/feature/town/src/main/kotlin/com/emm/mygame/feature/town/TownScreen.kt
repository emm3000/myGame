package com.emm.mygame.feature.town

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameRadii
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.TownLabel

@Composable
fun TownScreen(state: TownUiState, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(
                start = MyGameSpacing.step4,
                end = MyGameSpacing.step4,
                top = MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        when (state) {
            TownUiState.Loading -> {
                Header(isSigningOut = false, onIntent = onIntent)
                MyGameText(
                    text = stringResource(R.string.town_loading),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.inkMuted,
                )
            }
            TownUiState.Failed -> {
                Header(isSigningOut = false, onIntent = onIntent)
                MyGameErrorBanner(
                    message = stringResource(R.string.town_refusal_unexpected),
                    actionLabel = stringResource(R.string.town_try_again),
                    onAction = { onIntent(TownIntent.RetryTapped) },
                )
            }
            TownUiState.SigningOut -> Header(isSigningOut = true, onIntent = onIntent)
            is TownUiState.Naming -> {
                Header(isSigningOut = false, onIntent = onIntent)
                NamingSection(naming = state, onIntent = onIntent)
            }
            is TownUiState.Content -> TownHome(content = state, onIntent = onIntent)
        }
    }
}

@Composable
private fun TownHome(content: TownUiState.Content, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        Header(isSigningOut = false, onIntent = onIntent) {
            TownTitle(name = content.name, label = content.label)
        }
        StocksSection(content = content)
        BuildingWorkSection(content = content, onIntent = onIntent)
        PlacesSection(content = content, onIntent = onIntent)
    }
}

@Composable
private fun Header(
    isSigningOut: Boolean,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
    title: @Composable () -> Unit = {},
) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            title()
        }
        MyGameButton(
            label = stringResource(R.string.town_sign_out),
            isBusy = isSigningOut,
            busyDescription = stringResource(R.string.town_waiting),
            onClick = { onIntent(TownIntent.SignOutTapped) },
            modifier = Modifier.width(IntrinsicSize.Max),
        )
    }
}

@Composable
private fun TownTitle(name: String, label: TownLabel, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1), modifier = modifier) {
        MyGameText(
            text = name,
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(
            text = stringResource(labelOf(label)),
            style = MyGameTypography.label,
            color = MyGameTheme.colors.ink,
            modifier = Modifier
                .background(MyGameTheme.colors.surfaceRaised, RoundedCornerShape(MyGameRadii.pill))
                .padding(horizontal = MyGameSpacing.step2),
        )
    }
}

private fun labelOf(label: TownLabel): Int = when (label) {
    TownLabel.Town -> R.string.town_label_town
    TownLabel.City -> R.string.town_label_city
}
