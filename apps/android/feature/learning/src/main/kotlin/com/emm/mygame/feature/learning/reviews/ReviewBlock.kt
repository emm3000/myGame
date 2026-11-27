package com.emm.mygame.feature.learning.reviews

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.emm.mygame.core.designsystem.frame.MyGameBlock
import com.emm.mygame.core.designsystem.frame.MyGameBlockStack
import com.emm.mygame.core.designsystem.frame.MyGameFrame
import com.emm.mygame.core.designsystem.frame.MyGameFrameText
import com.emm.mygame.core.designsystem.frame.blockHueOf
import com.emm.mygame.core.designsystem.text.MyGameSupportLine
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.MyGameWordSupport
import com.emm.mygame.core.designsystem.text.wordStyle
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

@Composable
internal fun ReviewBlock(
    cue: String,
    frame: MyGameFrame,
    openSpan: Int?,
    reviewing: ReviewUiState.Reviewing,
    onIntent: (ReviewIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val walked: Int = reviewing.walked
    val dueAfter: Int = reviewing.dueCount - 1
    MyGameBlockStack(
        nearHue = blockHueOf(walked + 1).takeIf { dueAfter >= 1 },
        farHue = blockHueOf(walked + 2).takeIf { dueAfter >= 2 },
        dealtKey = walked.takeIf { reviewing.isDealtFromStack },
        modifier = modifier,
    ) {
        MyGameBlock(
            hue = blockHueOf(walked),
            modifier = Modifier.semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
        ) {
            MyGameText(
                text = cue,
                style = wordStyle(),
                color = MyGameTheme.colors.onBlock,
                modifier = Modifier.semantics { heading() },
            )
            MyGameFrameText(
                frame = frame,
                openPiece = openSpan,
                style = MyGameTypography.reading,
                onPieceTap = { spanIndex: Int -> onIntent(ReviewIntent.SupportTapped(spanIndex)) },
                modifier = Modifier.semantics { liveRegion = LiveRegionMode.Polite },
            )
            frame.openedSupportOf(openSpan)?.let { support: MyGameWordSupport -> MyGameSupportLine(support = support) }
        }
    }
}
