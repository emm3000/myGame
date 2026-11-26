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
import com.emm.mygame.core.designsystem.MyGameErrorBanner
import com.emm.mygame.core.designsystem.MyGameSizes
import com.emm.mygame.core.designsystem.MyGameSkeleton
import com.emm.mygame.core.designsystem.MyGameSkeletonBlocks
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.naming.NamingSection

@Composable
internal fun TownScreen(
    state: TownUiState,
    place: TownBuildingKind?,
    onIntent: (TownIntent) -> Unit,
    onPlaceOpen: (TownBuildingKind) -> Unit,
    onNewsOpen: () -> Unit,
    onSchoolOpen: () -> Unit,
    onMapOpen: () -> Unit,
    modifier: Modifier = Modifier,
    ring: @Composable () -> Unit = {},
) {
    val isContent: Boolean = state is TownUiState.Content
    val isPage: Boolean = place != null && isContent
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step6),
        modifier = modifier
            .fillMaxSize()
            .background(MyGameTheme.colors.surface)
            .safeDrawingPadding()
            .then(if (isPage) Modifier else Modifier.verticalScroll(rememberScrollState()))
            .padding(horizontal = MyGameSpacing.step4)
            .padding(vertical = if (isContent) MyGameSpacing.step2 else MyGameSpacing.step8),
    ) {
        MyGameSkeleton(
            isLoading = state == TownUiState.Loading,
            loadingLabel = chromeResource(R.string.town_loading).spoken,
            blocks = townBlocks,
        ) {
            TownState(state = state, onIntent = onIntent) { content: TownUiState.Content ->
                val shown: PlaceCard? = content.places.firstOrNull { card: PlaceCard -> card.kind == place }
                if (shown == null) {
                    TownGrid(
                        content = content,
                        onIntent = onIntent,
                        onPlaceOpen = onPlaceOpen,
                        onNewsOpen = onNewsOpen,
                        ring = ring,
                    )
                } else {
                    TownPage(
                        content = content,
                        place = shown,
                        onIntent = onIntent,
                        onSchoolOpen = onSchoolOpen,
                        onMapOpen = onMapOpen,
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            }
        }
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
        }
        is TownUiState.Naming -> NamingSection(naming = state, onIntent = onIntent)
        is TownUiState.Content -> home(state)
    }
}

private val townBlocks: MyGameSkeletonBlocks = MyGameSkeletonBlocks(
    listOf(
        MyGameSizes.control,
        MyGameSizes.secondary,
        MyGameSizes.placeCard,
        MyGameSizes.placeCard,
        MyGameSizes.placeCard,
    ),
)
