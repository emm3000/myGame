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
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.Terrain
import com.emm.mygame.core.network.TownJobRefusal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSite
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WasteSize
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

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
            label = chromeResource(R.string.map_title),
            style = MyGameTypography.display,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameSkeleton(
            isLoading = state == MapUiState.Loading,
            loadingLabel = chromeResource(R.string.map_loading).spoken,
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
            message = fixedCopyResource(R.string.map_refusal_unexpected),
            actionLabel = chromeResource(R.string.map_try_again),
            onAction = { onIntent(MapIntent.RetryTapped) },
        )
        MapUiState.AreaNotFound -> Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3)) {
            MyGameInlineAlert(message = fixedCopyResource(R.string.map_refusal_area_not_found))
            MyGameTextLink(
                label = chromeResource(R.string.map_back_to_own_area),
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
            label = chromeResource(R.string.map_area, "area" to areaLine.area.toString()),
            style = MyGameTypography.heading,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { heading() },
        )
        MyGameText(
            label = chromeResource(terrainNameOf(areaLine.terrain)),
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
                label = chromeResource(R.string.map_previous),
                onClick = { onIntent(MapIntent.AreaTapped(area)) },
            )
        }
        content.nextArea?.let { area: Int ->
            MyGameTextLink(
                label = chromeResource(R.string.map_next),
                onClick = { onIntent(MapIntent.AreaTapped(area)) },
            )
        }
    }
}

private val previewPay: List<MapUiState.PayLine> = listOf(
    MapUiState.PayLine(TownResourceKind.Money, 120L),
    MapUiState.PayLine(TownResourceKind.Material, 40L),
)

private val previewContent: MapUiState.Content = MapUiState.Content(
    areaLine = MapUiState.AreaLine(area = 2, terrain = Terrain.River),
    previousArea = 1,
    nextArea = 3,
    sites = listOf(
        MapUiState.SiteRow.Free(site = 1),
        MapUiState.SiteRow.Town(site = 2, name = "Hillcrest"),
        MapUiState.SiteRow.Own(site = 3, name = "Riverton"),
        MapUiState.SiteRow.Waste(site = 4, size = WasteSize.Medium, waste = 12),
    ),
    form = null,
    send = MapUiState.SendRequest.Idle,
    jobOut = null,
    callBack = MapUiState.CallBackRequest.Idle,
)

private val previewJobForm: MapUiState.JobForm = MapUiState.JobForm(
    site = 1,
    workers = "2",
    trucks = "1",
    hours = "2",
    workersAtHome = 3,
    trucksAtHome = 1,
    block = null,
    quote = MapUiState.PayQuote.Quoted(previewPay),
)

private val previewCleanUpForm: MapUiState.CleanUpForm = MapUiState.CleanUpForm(
    site = 4,
    workers = "3",
    trucks = "1",
    workersAtHome = 3,
    trucksAtHome = 1,
    block = null,
    quote = MapUiState.CleanUpQuote.Quoted(strength = 12, waste = 12, pay = previewPay, isShort = false),
)

private val previewJobOut: MapUiState.JobOut = MapUiState.JobOut(
    kind = MapUiState.JobKind.Job,
    site = TownSite(region = 1, area = 2, site = 1),
    workers = 2,
    trucks = 1,
    phase = TownSnapshot.JobPhase.Working,
    remaining = 48.minutes,
    finishesAt = Instant.parse("2026-11-05T12:20:00Z"),
    pay = previewPay,
    canCallBack = true,
)

private class MapUiStates : PreviewParameterProvider<MapUiState> {

    override val values: Sequence<MapUiState> = sequenceOf(
        previewContent,
        previewContent.copy(form = previewJobForm),
        previewContent.copy(form = previewCleanUpForm),
        previewContent.copy(jobOut = previewJobOut),
        previewContent.copy(
            form = previewJobForm.copy(
                hours = "12",
                quote = MapUiState.PayQuote.Refused(TownJobRefusal.JobHoursOutOfRange(hours = 12, maxHours = 8)),
            ),
        ),
        previewContent.copy(form = previewJobForm, send = MapUiState.SendRequest.Unreachable(site = 1)),
        previewContent.copy(jobOut = previewJobOut, callBack = MapUiState.CallBackRequest.Unreachable),
        MapUiState.Loading,
        MapUiState.Failed,
        MapUiState.AreaNotFound,
    )
}

@PreviewMyGame
@Composable
private fun MapScreenPreview(@PreviewParameter(MapUiStates::class) state: MapUiState) {
    MyGamePreviewSurface {
        MapScreen(state = state, onIntent = {})
    }
}

private class MapLanguages : PreviewParameterProvider<CopyLanguage> {

    override val values: Sequence<CopyLanguage> = sequenceOf(
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English),
        CopyLanguage(ScaffoldLanguage.None, ChromePhase.English),
    )
}

@PreviewMyGame
@Composable
private fun MapScreenLanguagePreview(@PreviewParameter(MapLanguages::class) language: CopyLanguage) {
    ProvideCopyLanguage(language = language) {
        MyGamePreviewSurface {
            MapScreen(state = previewContent.copy(form = previewJobForm, jobOut = previewJobOut), onIntent = {})
        }
    }
}

@PreviewMyGame
@Composable
private fun MapScreenCleanUpBothPreview() {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            MapScreen(
                state = previewContent.copy(
                    form = previewCleanUpForm,
                    send = MapUiState.SendRequest.Refused(site = 4, refusal = TownJobRefusal.NoWasteYet),
                ),
                onIntent = {},
            )
        }
    }
}
