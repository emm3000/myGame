package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTextLink
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.PlacementRepository

@Composable
fun PlacementOfferRoute(
    placements: PlacementRepository,
    onPlacementOpen: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: PlacementOfferViewModel = viewModel { PlacementOfferViewModel(placements) },
) {
    val state: PlacementOfferUiState by viewModel.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(PlacementOfferIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(PlacementOfferIntent.ScreenHidden) }
    }
    PlacementOfferRow(state = state, onPlacementOpen = onPlacementOpen, modifier = modifier)
}

@Composable
fun PlacementOfferRow(state: PlacementOfferUiState, onPlacementOpen: () -> Unit, modifier: Modifier = Modifier) {
    val link: Int = when (state) {
        PlacementOfferUiState.Hidden -> return
        PlacementOfferUiState.Offered -> R.string.placement_offer_link
        PlacementOfferUiState.Asking -> R.string.placement_offer_resume_link
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameHairline()
        Column {
            MyGameText(
                text = stringResource(R.string.placement_title),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                text = stringResource(R.string.placement_offer_line),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        MyGameTextLink(label = stringResource(link), onClick = onPlacementOpen)
    }
}

private class PlacementOfferStates : PreviewParameterProvider<PlacementOfferUiState> {
    override val values: Sequence<PlacementOfferUiState> =
        sequenceOf(PlacementOfferUiState.Offered, PlacementOfferUiState.Asking)
}

@PreviewMyGame
@Composable
private fun PlacementOfferRowPreview(@PreviewParameter(PlacementOfferStates::class) state: PlacementOfferUiState) {
    MyGamePreviewSurface {
        PlacementOfferRow(state = state, onPlacementOpen = {})
    }
}
