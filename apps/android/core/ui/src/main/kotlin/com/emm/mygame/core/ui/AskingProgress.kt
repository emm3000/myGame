package com.emm.mygame.core.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.control.MyGameTrack
import com.emm.mygame.core.designsystem.text.MyGameMetaText
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

@Composable
fun AskingProgress(band: String, progress: String, shownIndex: Int, total: Int, modifier: Modifier = Modifier) {
    val filled: Float = (shownIndex + 1).toFloat() / total
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameMetaText(
            text = band,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameText(
            text = progress,
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameTrack(
            filled = filled,
            color = MyGameTheme.colors.ink,
            modifier = Modifier.semantics { progressBarRangeInfo = ProgressBarRangeInfo(filled, 0f..1f) },
        )
    }
}
