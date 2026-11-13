package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameHairline
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.PlacementScore
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun PlacementResult(
    closed: PlacementUiState.Closed,
    onTownOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        if (closed.scores.isEmpty()) {
            MyGameText(
                text = fixedCopyResource(R.string.placement_closed_none),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
        } else {
            MyGameText(
                text = fixedCopyResource(R.string.placement_result_title),
                style = MyGameTypography.title,
                color = MyGameTheme.colors.ink,
                modifier = Modifier.semantics { heading() },
            )
            closed.scores.forEach { score: PlacementScore -> BandScore(score = score) }
        }
        MyGameButton(
            label = fixedCopyResource(R.string.placement_to_town),
            isBusy = false,
            busyDescription = fixedCopyResource(R.string.placement_sending),
            onClick = onTownOpen,
        )
    }
}

@Composable
internal fun BandScore(score: PlacementScore, modifier: Modifier = Modifier) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameHairline()
        BandScoreLines(score = score)
    }
}

@Composable
private fun BandScoreLines(score: PlacementScore, modifier: Modifier = Modifier) {
    Column(modifier = modifier.semantics(mergeDescendants = true) {}) {
        MyGameText(
            text = fixedCopyResource(
                R.string.placement_result_band,
                "band" to score.band.number.toString(),
                "score" to score.score,
            ),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = fixedCopyResource(
                if (score.isPlacedOut) R.string.placement_placed_out else R.string.placement_not_placed_out,
            ),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
    }
}
