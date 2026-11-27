package com.emm.mygame.core.designsystem.text

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.frame.MyGameBlock
import com.emm.mygame.core.designsystem.frame.MyGameBlockHue
import com.emm.mygame.core.designsystem.frame.MyGameFrameGround
import com.emm.mygame.core.designsystem.frame.inkMuted
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGameSupportLine(
    support: MyGameWordSupport,
    modifier: Modifier = Modifier,
    ground: MyGameFrameGround = MyGameFrameGround.Block,
) {
    MyGameText(
        text = support.spokenText(),
        style = MyGameTypography.gloss,
        color = ground.inkMuted(),
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
