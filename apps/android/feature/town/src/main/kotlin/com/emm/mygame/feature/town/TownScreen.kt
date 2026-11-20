package com.emm.mygame.feature.town

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PagerState
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.MutableIntState
import androidx.compose.runtime.movableContentOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.NextStepText
import com.emm.mygame.core.network.SeasonKind
import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.TipKind
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.joinsFrameTraversal
import kotlin.time.Duration.Companion.days
import kotlin.time.Duration.Companion.minutes
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

@Composable
fun TownScreen(
    state: TownUiState,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onMapOpen: () -> Unit,
    modifier: Modifier = Modifier,
    onTextOpen: (TextId) -> Unit = {},
    ring: @Composable () -> Unit = {},
    status: @Composable () -> Unit = {},
    foldedDock: @Composable () -> Unit = {},
    reportRow: @Composable () -> Unit = {},
    placement: @Composable () -> Unit = {},
) {
    val placedFoldedDock: @Composable () -> Unit = remember(foldedDock) { movableContentOf(foldedDock) }
    val placedReportRow: @Composable () -> Unit = remember(reportRow) { movableContentOf(reportRow) }
    val drawnHeaders: MutableIntState = remember { mutableIntStateOf(0) }
    val slots: TownPageSlots = TownPageSlots(
        ring = ring,
        status = status,
        placement = placement,
        onSchoolOpen = onSchoolOpen,
        onMapOpen = onMapOpen,
        onTextOpen = onTextOpen,
    )
    val isHome: Boolean = state is TownUiState.Content
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .joinsFrameTraversal()
            .then(if (isHome) Modifier else Modifier.verticalScroll(rememberScrollState()))
            .then(if (isHome) Modifier else Modifier.padding(horizontal = MyGameSpacing.step4))
            .padding(
                top = if (isHome) MyGameSpacing.step2 else MyGameSpacing.step8,
                bottom = if (isHome) MyGameSpacing.step2 else MyGameSpacing.step8,
            ),
    ) {
        when {
            !isHome -> {
                placedFoldedDock()
                placedReportRow()
            }
            drawnHeaders.intValue == 0 -> HomeTopBeforeHeader(placedFoldedDock, placedReportRow)
        }
        MyGameSkeleton(
            isLoading = state == TownUiState.Loading,
            loadingLabel = chromeResource(R.string.town_loading).spoken,
            blocks = townBlocks,
        ) {
            TownState(state = state, onIntent = onIntent) { content: TownUiState.Content ->
                TownHome(
                    content = content,
                    onIntent = onIntent,
                    slots = slots,
                    top = TownPageTop(
                        foldedDock = {
                            if (drawnHeaders.intValue > 0) placedFoldedDock()
                            DisposableEffect(Unit) {
                                drawnHeaders.intValue += 1
                                onDispose { drawnHeaders.intValue -= 1 }
                            }
                        },
                        reportRow = { if (drawnHeaders.intValue > 0) placedReportRow() },
                    ),
                )
            }
        }
    }
}

@Composable
private fun HomeTopBeforeHeader(
    foldedDock: @Composable () -> Unit,
    reportRow: @Composable () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier.padding(horizontal = MyGameSpacing.step4),
    ) {
        foldedDock()
        reportRow()
    }
}

@Composable
private fun TownState(
    state: TownUiState,
    onIntent: (TownIntent) -> Unit,
    home: @Composable (TownUiState.Content) -> Unit,
) {
    when (state) {
        TownUiState.Loading -> Unit
        TownUiState.Failed -> {
            MyGameErrorBanner(
                message = fixedCopyResource(R.string.town_refusal_unexpected),
                actionLabel = chromeResource(R.string.town_try_again),
                onAction = { onIntent(TownIntent.RetryTapped) },
            )
            SignOut(isBusy = false, onIntent = onIntent)
        }
        is TownUiState.SigningOut -> SignOut(isBusy = true, onIntent = onIntent)
        is TownUiState.Naming -> {
            NamingSection(naming = state, onIntent = onIntent)
            SignOut(isBusy = false, onIntent = onIntent)
        }
        is TownUiState.Content -> home(state)
    }
}

private val townBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(
        MyGameSizes.control,
        MyGameSizes.placeCard,
        MyGameSizes.secondary,
        MyGameSizes.placeCard,
        MyGameSizes.thumbnail,
    ),
)

@Composable
private fun SignOut(isBusy: Boolean, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    MyGameTextLink(
        label = fixedCopyResource(R.string.town_sign_out),
        isBusy = isBusy,
        busyDescription = chromeResource(R.string.town_waiting).spoken,
        onClick = { onIntent(TownIntent.SignOutTapped) },
        modifier = modifier,
    )
}

@Composable
private fun TownHome(
    content: TownUiState.Content,
    onIntent: (TownIntent) -> Unit,
    slots: TownPageSlots,
    top: TownPageTop,
    modifier: Modifier = Modifier,
) {
    val pager: PagerState = rememberPagerState(initialPage = content.openingPage()) { content.places.size }
    val scope: CoroutineScope = rememberCoroutineScope()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier.fillMaxSize()) {
        HorizontalPager(
            state = pager,
            key = { index: Int -> content.places[index].kind },
            verticalAlignment = Alignment.Top,
            modifier = Modifier.weight(1f).joinsFrameTraversal(),
        ) { index: Int ->
            TownPage(
                content = content,
                place = content.places[index],
                onIntent = onIntent,
                slots = slots,
                top = if (index == pager.currentPage) top else TownPageTop.none,
                modifier = Modifier.fillMaxSize().padding(horizontal = MyGameSpacing.step4),
            )
        }
        TownStreetStrip(
            content = content,
            selected = pager.currentPage,
            onSelect = { index: Int -> scope.launch { pager.animateScrollToPage(index) } },
            modifier = Modifier.padding(horizontal = MyGameSpacing.step4),
        )
    }
}

private fun TownUiState.Content.openingPage(): Int =
    places.indexOfFirst { place: TownUiState.PlaceCard -> place.kind == nextStepPlace }.coerceAtLeast(0)

private val previewGoal: TownGoal = TownGoal(
    position = 2,
    count = 9,
    building = TownBuildingKind.Factory,
    level = 1,
    state = TownGoal.State.Pending(
        resources = listOf(TownSnapshot.Cost(TownResourceKind.Money, 50)),
        people = 0,
    ),
)

private val previewHome: TownUiState.Content = TownUiState.Content(
    name = "Riverton",
    label = TownLabel.Town,
    stocks = TownResourceKind.entries.map { kind: TownResourceKind ->
        TownUiState.StockLine(kind = kind, amount = 350, capacity = 1000, ratePerHour = 20, skillLevel = 0, fill = null)
    },
    people = TownUiState.PeopleLine(free = 19, atWork = 1),
    words = TownUiState.WordsLine(stable = 0, retained = 0),
    season = TownUiState.SeasonLine(
        kind = SeasonKind.Summer,
        year = 2,
        remaining = 3.days,
        productionMarks = listOf(TownUiState.ProductionMark(TownResourceKind.Food, percent = 125)),
    ),
    buildMark = TownUiState.DurationMark(SeasonKind.Summer, percent = 75),
    slot = TownUiState.SlotLine.Idle,
    waitingList = emptyList(),
    places = streetOrder.map { kind: TownBuildingKind ->
        TownUiState.PlaceCard(
            kind = kind,
            level = 0,
            raisedFrom = null,
            isInWork = false,
            next = TownUiState.NextLevelLine(
                level = 1,
                costs = listOf(
                    TownUiState.CostLine(TownResourceKind.Money, amount = 400, isShort = true),
                    TownUiState.CostLine(TownResourceKind.Material, amount = 120, isShort = false),
                ),
                duration = 2.minutes,
                people = 1,
                wordsNeeded = null,
            ),
            block = null,
        )
    },
    nextStepPlace = TownBuildingKind.Factory,
    goal = previewGoal,
    caughtUpGoal = previewGoal,
    newestText = NextStepText(TextId("text-31"), "The New Shop"),
    tip = TipKind.Seasons,
    start = TownUiState.StartStatus.Idle,
    stop = TownUiState.StopStatus.Idle,
    office = TownUiState.OfficeLine(
        hiring = TownUiState.HiringLine.Idle,
        hires = emptyList(),
        hireMark = null,
        place = TownUiState.HireStatus.Idle,
        stop = TownUiState.HireStopStatus.Idle,
    ),
)

private class TownScreenStates : PreviewParameterProvider<TownUiState> {

    override val values: Sequence<TownUiState> = sequenceOf(
        TownUiState.Loading,
        TownUiState.Failed,
        TownUiState.Naming(name = "Riverton", status = TownUiState.NamingStatus.Idle),
        previewHome,
        previewHome.copy(
            season = TownUiState.SeasonLine(
                kind = SeasonKind.Winter,
                year = 2,
                remaining = 2.days,
                productionMarks = listOf(TownUiState.ProductionMark(TownResourceKind.Power, percent = 75)),
            ),
            buildMark = null,
        ),
        previewHome.copy(
            season = TownUiState.SeasonLine(
                kind = SeasonKind.Spring,
                year = 2,
                remaining = 4.days,
                productionMarks = emptyList(),
            ),
            buildMark = null,
            office = previewHome.office.copy(
                hires = listOf(
                    TownUiState.HireCard(TownHireKind.Truck, team = 0, requiredOfficeLevel = 3, form = null),
                ),
                hireMark = TownUiState.DurationMark(SeasonKind.Spring, percent = 75),
            ),
        ),
    )
}

private class TownLanguages : PreviewParameterProvider<CopyLanguage> {

    override val values: Sequence<CopyLanguage> = sequenceOf(
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Scaffold),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both),
        CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.English),
        CopyLanguage(ScaffoldLanguage.None, ChromePhase.English),
    )
}

@PreviewMyGame
@Composable
private fun TownScreenLanguagePreview(@PreviewParameter(TownLanguages::class) language: CopyLanguage) {
    ProvideCopyLanguage(language = language) {
        MyGamePreviewSurface {
            TownScreen(
                state = previewHome,
                onIntent = {},
                onSchoolOpen = {},
                onMapOpen = {},
            )
        }
    }
}

@PreviewMyGame
@Composable
private fun TownScreenNamingBothPreview() {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            TownScreen(
                state = TownUiState.Naming(name = "Riverton", status = TownUiState.NamingStatus.Idle),
                onIntent = {},
                onSchoolOpen = {},
                onMapOpen = {},
            )
        }
    }
}

@PreviewMyGame
@Composable
private fun TownScreenPreview(@PreviewParameter(TownScreenStates::class) state: TownUiState) {
    MyGamePreviewSurface {
        TownScreen(
            state = state,
            onIntent = {},
            onSchoolOpen = {},
            onMapOpen = {},
        )
    }
}
