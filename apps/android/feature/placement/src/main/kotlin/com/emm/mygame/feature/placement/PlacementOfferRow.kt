package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameOutlinedDoor
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSunkenCard
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.ui.ChromePhase
import com.emm.mygame.core.ui.CopyLanguage
import com.emm.mygame.core.ui.ProvideCopyLanguage
import com.emm.mygame.core.ui.ScaffoldLanguage
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.fixedLabel

@Composable
fun PlacementOfferRow(state: PlacementOfferUiState, onPlacementOpen: () -> Unit, modifier: Modifier = Modifier) {
    val link: Int = when (state) {
        PlacementOfferUiState.Hidden -> return
        PlacementOfferUiState.Offered -> R.string.placement_offer_link
        PlacementOfferUiState.Asking -> R.string.placement_offer_resume_link
    }
    MyGameSunkenCard(modifier = modifier) {
        Column {
            MyGameText(
                text = fixedCopyResource(R.string.placement_title),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            MyGameText(
                text = fixedCopyResource(R.string.placement_offer_line),
                style = MyGameTypography.caption,
                color = MyGameTheme.colors.inkMuted,
            )
        }
        MyGameOutlinedDoor(label = fixedLabel(link), onClick = onPlacementOpen)
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

@PreviewMyGame
@Composable
private fun PlacementOfferRowBothPreview(@PreviewParameter(PlacementOfferStates::class) state: PlacementOfferUiState) {
    ProvideCopyLanguage(language = CopyLanguage(ScaffoldLanguage.Spanish, ChromePhase.Both)) {
        MyGamePreviewSurface {
            PlacementOfferRow(state = state, onPlacementOpen = {})
        }
    }
}
