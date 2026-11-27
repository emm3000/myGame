package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.frame.MyGameHairline
import com.emm.mygame.core.designsystem.frame.MyGameSunkenCard
import com.emm.mygame.core.designsystem.text.MyGameMetaText
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.model.placement.PlacementScore
import com.emm.mygame.core.ui.fixedCopyResource

internal const val PLACEMENT_RESULT_CARD: String = "placement_result_card"

@Composable
internal fun PlacementResult(
    closed: PlacementUiState.Closed,
    modifier: Modifier = Modifier,
) {
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        if (closed.scores.isEmpty()) {
            MyGameText(
                text = fixedCopyResource(R.string.placement_closed_none),
                style = MyGameTypography.body,
                color = MyGameTheme.colors.ink,
            )
        } else {
            MyGameMetaText(
                text = fixedCopyResource(R.string.placement_result_title),
                color = MyGameTheme.colors.inkMuted,
                modifier = Modifier.semantics { heading() },
            )
            MyGameSunkenCard(modifier = Modifier.testTag(PLACEMENT_RESULT_CARD)) {
                closed.scores.forEach { score: PlacementScore -> BandScoreLines(score = score) }
            }
        }
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
