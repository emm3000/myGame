package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics

@Composable
fun MyGameSupportLine(support: MyGameWordSupport, modifier: Modifier = Modifier) {
    MyGameText(
        text = support.spokenText(),
        style = MyGameTypography.gloss,
        color = MyGameTheme.colors.onBlockMuted,
        modifier = modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
    )
}

@PreviewMyGame
@Composable
private fun MyGameSupportLinePreview() {
    MyGamePreviewSurface {
        MyGameBlock(hue = MyGameBlockHue.entries.first()) {
            MyGameSupportLine(support = MyGameWordSupport(isOnTap = true, text = "caminar", languageTag = "es"))
            MyGameSupportLine(
                support = MyGameWordSupport(isOnTap = true, text = "to move on foot", languageTag = "en"),
            )
        }
    }
}
