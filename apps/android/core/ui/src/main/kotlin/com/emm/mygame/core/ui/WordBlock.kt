package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.frame.MyGameBlock
import com.emm.mygame.core.designsystem.frame.blockHueOf
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.wordStyle
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.model.placement.PlacementItem

@Composable
fun WordBlock(item: PlacementItem, index: Int, modifier: Modifier = Modifier) {
    MyGameBlock(
        hue = blockHueOf(index),
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    ) {
        MyGameText(
            text = item.text,
            style = wordStyle(),
            color = MyGameTheme.colors.onBlock,
            modifier = Modifier.semantics { heading() },
        )
    }
}
