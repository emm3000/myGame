package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.MyGameMetaText
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTrack
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun AskingProgress(band: PlacementBand, shownIndex: Int, total: Int, modifier: Modifier = Modifier) {
    val filled: Float = (shownIndex + 1).toFloat() / total
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameMetaText(
            text = fixedCopyResource(R.string.placement_band, "band" to band.number.toString()),
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = fixedCopyResource(
                R.string.placement_progress,
                "number" to (shownIndex + 1).toString(),
                "total" to total.toString(),
            ),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameTrack(
            filled = filled,
            color = MyGameTheme.colors.action,
            modifier = Modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
        )
    }
}
