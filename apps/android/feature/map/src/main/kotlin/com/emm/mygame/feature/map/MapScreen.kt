package com.emm.mygame.feature.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

@Composable
fun MapScreen(state: MapUiState, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
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
        MyGameText(
            text = stringResource(R.string.map_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == MapUiState.Loading,
            loadingLabel = stringResource(R.string.map_loading),
            blocks = mapBlocks,
        ) {
            MapState(state = state, onIntent = onIntent)
        }
    }
}

@Composable
private fun MapState(state: MapUiState, onIntent: (MapIntent) -> Unit) {
    when (state) {
        MapUiState.Loading -> Unit
        MapUiState.Failed -> MyGameErrorBanner(
            message = stringResource(R.string.map_refusal_unexpected),
            actionLabel = stringResource(R.string.map_try_again),
            onAction = { onIntent(MapIntent.RetryTapped) },
        )
        MapUiState.AreaNotFound -> Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
            MyGameInlineAlert(message = stringResource(R.string.map_refusal_area_not_found))
            MyGameTextLink(
                label = stringResource(R.string.map_back_to_own_area),
                onClick = { onIntent(MapIntent.OwnAreaTapped) },
            )
        }
        is MapUiState.Content -> MapContent(content = state, onIntent = onIntent)
    }
}

private val mapBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(
        MyGameSizes.placeCard,
        MyGameSizes.control,
        MyGameSizes.thumbnail,
        MyGameSizes.thumbnail,
    ),
)

@Composable
private fun MapContent(content: MapUiState.Content, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        content.jobOut?.let { jobOut: MapUiState.JobOut ->
            JobOutCard(jobOut = jobOut, callBack = content.callBack, onIntent = onIntent)
        }
        Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2)) {
            AreaHeader(areaLine = content.areaLine)
            AreaLinks(content = content, onIntent = onIntent)
            Column {
                content.sites.forEachIndexed { index: Int, row: MapUiState.SiteRow ->
                    if (index > 0) MyGameHairline()
                    SiteItem(row = row, content = content, onIntent = onIntent)
                }
            }
        }
    }
}

@Composable
private fun AreaHeader(areaLine: MapUiState.AreaLine, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        MyGameText(
            text = icuStringResource(R.string.map_area, "area" to areaLine.area.toString()),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(
            text = stringResource(terrainNameOf(areaLine.terrain)),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}

@Composable
private fun AreaLinks(content: MapUiState.Content, onIntent: (MapIntent) -> Unit, modifier: Modifier = Modifier) {
    Row(horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step6), modifier = modifier) {
        content.previousArea?.let { area: Int ->
            MyGameTextLink(
                label = stringResource(R.string.map_previous),
                onClick = { onIntent(MapIntent.AreaTapped(area)) },
            )
        }
        content.nextArea?.let { area: Int ->
            MyGameTextLink(
                label = stringResource(R.string.map_next),
                onClick = { onIntent(MapIntent.AreaTapped(area)) },
            )
        }
    }
}
