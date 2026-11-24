package com.emm.mygame.feature.placement

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.ui.fixedLabel

@Composable
internal fun progressLabel(shownIndex: Int, total: Int): MyGameLabel = fixedLabel(
    R.string.placement_progress,
    "number" to (shownIndex + 1).toString(),
    "total" to total.toString(),
)
