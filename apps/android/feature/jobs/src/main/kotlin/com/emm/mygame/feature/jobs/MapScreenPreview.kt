package com.emm.mygame.feature.jobs

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.PreviewMyGame
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.jobs.Terrain
import com.emm.mygame.core.model.town.jobs.TownJobRefusal
import com.emm.mygame.core.model.town.jobs.WasteSize
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.DurationMark
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

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
    roadMark = null,
    quote = MapUiState.PayQuote.Quoted(previewPay),
)

private val previewCleanUpForm: MapUiState.CleanUpForm = MapUiState.CleanUpForm(
    site = 4,
    workers = "3",
    trucks = "1",
    workersAtHome = 3,
    trucksAtHome = 1,
    block = null,
    roadMark = null,
    quote = MapUiState.CleanUpQuote.Quoted(strength = 12, waste = 12, pay = previewPay, isShort = false),
)

private val previewFallRoad: DurationMark = DurationMark(SeasonKind.Fall, percent = 75)

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
        previewContent.copy(form = previewJobForm.copy(roadMark = previewFallRoad)),
        previewContent.copy(form = previewCleanUpForm.copy(roadMark = previewFallRoad)),
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
            MapScreen(
                state = previewContent.copy(
                    form = previewJobForm.copy(roadMark = previewFallRoad),
                    jobOut = previewJobOut,
                ),
                onIntent = {},
            )
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
