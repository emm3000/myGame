package com.emm.mygame.feature.town

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
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameHeader
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.ui.icuStringResource

@Composable
fun TownScreen(
    state: TownUiState,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onReportOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
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
                top = if (state is TownUiState.Content) MyGameSpacing.step2 else MyGameSpacing.step8,
                bottom = MyGameSpacing.step8,
            ),
    ) {
        when (state) {
            TownUiState.Loading -> MyGameText(
                text = stringResource(R.string.town_loading),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
            TownUiState.Failed -> {
                MyGameErrorBanner(
                    message = stringResource(R.string.town_refusal_unexpected),
                    actionLabel = stringResource(R.string.town_try_again),
                    onAction = { onIntent(TownIntent.RetryTapped) },
                )
                SignOut(isBusy = false, onIntent = onIntent)
            }
            TownUiState.SigningOut -> SignOut(isBusy = true, onIntent = onIntent)
            is TownUiState.Naming -> {
                NamingSection(naming = state, onIntent = onIntent)
                SignOut(isBusy = false, onIntent = onIntent)
            }
            is TownUiState.Content -> TownHome(
                content = state,
                onIntent = onIntent,
                onSchoolOpen = onSchoolOpen,
                onReportOpen = onReportOpen,
            )
        }
    }
}

@Composable
private fun SignOut(isBusy: Boolean, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    MyGameTextButton(
        label = stringResource(R.string.town_sign_out),
        isBusy = isBusy,
        busyDescription = stringResource(R.string.town_waiting),
        onClick = { onIntent(TownIntent.SignOutTapped) },
        modifier = modifier,
    )
}

@Composable
private fun TownHome(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onReportOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        MyGameHeader {
            TownTitle(name = content.name, label = content.label)
        }
        TownDoors(onSchoolOpen = onSchoolOpen, onReportOpen = onReportOpen)
        TownSkyline(content = content)
        StocksSection(content = content)
        BuildingWorkSection(content = content, onIntent = onIntent)
        PlacesSection(content = content, onIntent = onIntent, onSchoolOpen = onSchoolOpen)
    }
}

@Composable
private fun TownTitle(name: String, label: TownLabel, modifier: Modifier = Modifier) {
    MyGameMetaText(
        text = icuStringResource(R.string.town_title, "name" to name, "label" to stringResource(labelOf(label))),
        color = MyGameTheme.colors.inkMuted,
        modifier = modifier.semantics { heading() },
    )
}

private fun labelOf(label: TownLabel): Int = when (label) {
    TownLabel.Town -> R.string.town_label_town
    TownLabel.City -> R.string.town_label_city
}
