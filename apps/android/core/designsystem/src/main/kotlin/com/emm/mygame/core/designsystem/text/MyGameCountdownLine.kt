package com.emm.mygame.core.designsystem.text

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.emm.mygame.core.designsystem.control.MyGameWorkingDots
import com.emm.mygame.core.designsystem.frame.MyGameBlock
import com.emm.mygame.core.designsystem.frame.MyGameBlockHue
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGameCountdownLine(
    words: String,
    time: String,
    ground: MyGameCountdownGround,
    modifier: Modifier = Modifier,
) {
    MyGameCountdownLine(
        words = MyGameLabel(text = words, translation = null),
        time = MyGameLabel(text = time, translation = null),
        ground = ground,
        modifier = modifier,
    )
}

@Composable
fun MyGameCountdownLine(
    words: MyGameLabel,
    time: MyGameLabel,
    ground: MyGameCountdownGround,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val lineColor: Color = if (ground == MyGameCountdownGround.Block) colors.onBlockMuted else colors.inkMuted
    val timeColor: Color = if (ground == MyGameCountdownGround.Block) colors.onBlock else colors.ink
    FlowRow(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
        itemVerticalAlignment = Alignment.CenterVertically,
        modifier = modifier,
    ) {
        MyGameWorkingDots(tint = lineColor)
        MyGameText(label = words, style = MyGameTypography.caption, color = lineColor)
        MyGameText(label = time, style = MyGameTypography.title.withTabularFigures(), color = timeColor)
    }
}

@PreviewMyGame
@Composable
private fun MyGameCountdownLinePreview() {
    MyGamePreviewSurface {
        MyGameCountdownLine(words = "Ready in", time = "12:40", ground = MyGameCountdownGround.Paper)
        MyGameBlock(hue = MyGameBlockHue.Peach) {
            MyGameCountdownLine(words = "Ready in", time = "12:40", ground = MyGameCountdownGround.Block)
        }
    }
}
