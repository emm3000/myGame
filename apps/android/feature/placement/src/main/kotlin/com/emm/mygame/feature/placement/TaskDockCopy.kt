package com.emm.mygame.feature.placement

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun fixedLabel(@StringRes id: Int, vararg arguments: Pair<String, Any>): MyGameLabel =
    MyGameLabel(text = fixedCopyResource(id, *arguments), translation = null)

@Composable
internal fun progressLabel(shownIndex: Int, total: Int): MyGameLabel = fixedLabel(
    R.string.placement_progress,
    "number" to (shownIndex + 1).toString(),
    "total" to total.toString(),
)
