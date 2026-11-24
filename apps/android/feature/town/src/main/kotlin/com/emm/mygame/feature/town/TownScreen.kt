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
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.joinsFrameTraversal
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.naming.NamingSection
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

@Composable
internal fun TownScreen(
    state: TownUiState,
    onIntent: (TownIntent) -> Unit,
    onSchoolOpen: () -> Unit,
    onMapOpen: () -> Unit,
    onTextOpen: (TextId) -> Unit,
    modifier: Modifier = Modifier,
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
                            DrawnWhen(isDrawn = drawnHeaders.intValue > 0, content = placedFoldedDock)
                            DisposableEffect(Unit) {
                                drawnHeaders.intValue += 1
                                onDispose { drawnHeaders.intValue -= 1 }
                            }
                        },
                        reportRow = { DrawnWhen(isDrawn = drawnHeaders.intValue > 0, content = placedReportRow) },
                    ),
                )
            }
        }
    }
}

@Composable
private fun DrawnWhen(isDrawn: Boolean, content: @Composable () -> Unit) {
    if (isDrawn) content()
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
    places.indexOfFirst { place: PlaceCard -> place.kind == nextStepPlace }.coerceAtLeast(0)
