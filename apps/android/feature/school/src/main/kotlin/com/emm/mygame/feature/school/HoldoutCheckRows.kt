package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
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
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
fun HoldoutCheckRowsRoute(
    holdoutChecks: HoldoutCheckRepository,
    onHoldoutCheckOpen: (HoldoutCheckRow) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: HoldoutCheckRowsViewModel = viewModel { HoldoutCheckRowsViewModel(holdoutChecks) },
) {
    val state: HoldoutCheckRowsUiState by viewModel.state.collectAsStateWithLifecycle()
    LifecycleStartEffect(viewModel) {
        viewModel.onIntent(HoldoutCheckRowsIntent.ScreenShown)
        onStopOrDispose { viewModel.onIntent(HoldoutCheckRowsIntent.ScreenHidden) }
    }
    HoldoutCheckRows(state = state, onHoldoutCheckOpen = onHoldoutCheckOpen, modifier = modifier)
}

@Composable
fun HoldoutCheckRows(
    state: HoldoutCheckRowsUiState,
    onHoldoutCheckOpen: (HoldoutCheckRow) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (state.rows.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        state.rows.forEach { row: HoldoutCheckRow ->
            HoldoutCheckRowLine(row = row, onHoldoutCheckOpen = onHoldoutCheckOpen)
        }
    }
}

@Composable
private fun HoldoutCheckRowLine(
    row: HoldoutCheckRow,
    onHoldoutCheckOpen: (HoldoutCheckRow) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameHairline()
        MyGameText(
            text = fixedCopyResource(R.string.school_holdout_row, "band" to row.band.number.toString()),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameTextLink(
            label = fixedCopyResource(R.string.school_holdout_open),
            onClick = { onHoldoutCheckOpen(row) },
        )
    }
}

private class HoldoutCheckRowsStates : PreviewParameterProvider<HoldoutCheckRowsUiState> {
    override val values: Sequence<HoldoutCheckRowsUiState> = sequenceOf(
        HoldoutCheckRowsUiState(listOf(HoldoutCheckRow(PlacementBand.First, HoldoutCheckWeek.Eighth))),
        HoldoutCheckRowsUiState(
            listOf(
                HoldoutCheckRow(PlacementBand.First, HoldoutCheckWeek.TwentyFourth),
                HoldoutCheckRow(PlacementBand.Second, HoldoutCheckWeek.Eighth),
            ),
        ),
    )
}

@PreviewMyGame
@Composable
private fun HoldoutCheckRowsPreview(@PreviewParameter(HoldoutCheckRowsStates::class) state: HoldoutCheckRowsUiState) {
    MyGamePreviewSurface {
        HoldoutCheckRows(state = state, onHoldoutCheckOpen = {})
    }
}
