package com.emm.mygame.feature.school

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import androidx.lifecycle.compose.LifecycleStartEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameNavRow
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
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
    val due: String = fixedCopyResource(
        R.string.school_holdout_row,
        "band" to row.band.number.toString(),
        "week" to row.week.number.toString(),
    )
    MyGameNavRow(
        title = MyGameLabel(text = fixedCopyResource(R.string.school_holdout_open), translation = null),
        body = AnnotatedString(due),
        onClick = { onHoldoutCheckOpen(row) },
        modifier = modifier,
    )
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
