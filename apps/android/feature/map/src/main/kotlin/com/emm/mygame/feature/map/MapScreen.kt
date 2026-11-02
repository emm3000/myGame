package com.emm.mygame.feature.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
fun MapScreen(state: MapUiState, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(start = MyGameSpacing.step4, end = MyGameSpacing.step4, top = MyGameSpacing.step8)
            .padding(bottom = MyGameSpacing.step8),
    ) {
        MyGameText(
            text = stringResource(R.string.map_title),
            style = MyGameTypography.title,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        when (state) {
            MapUiState.Loading -> MyGameText(
                text = stringResource(R.string.map_loading),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.inkMuted,
            )
            is MapUiState.Failed -> MyGameErrorBanner(
                message = stringResource(R.string.map_unreachable),
                actionLabel = stringResource(R.string.map_retry),
                onAction = { onIntent(MapIntent.RetryTapped) },
            )
            MapUiState.ProvinceNotFound -> ProvinceNotFound(onIntent = onIntent)
            is MapUiState.Content -> ProvinceView(content = state, onIntent = onIntent)
        }
    }
}

@Composable
private fun ProvinceNotFound(onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        horizontalAlignment = Alignment.Start,
        modifier = modifier,
    ) {
        MyGameInlineAlert(message = stringResource(R.string.map_province_not_found))
        MyGameTextLink(
            label = stringResource(R.string.map_own_province),
            onClick = { onIntent(MapIntent.OwnProvinceTapped) },
        )
    }
}
