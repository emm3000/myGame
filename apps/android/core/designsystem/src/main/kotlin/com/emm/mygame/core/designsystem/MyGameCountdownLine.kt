package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

@Composable
fun MyGameCountdownLine(
    words: String,
    time: String,
    ground: MyGameCountdownGround,
    modifier: Modifier = Modifier,
) {
    MyGameCountdownLine(
        words = MyGameLabel(text = words, translation = null),
        time = time,
        ground = ground,
        modifier = modifier,
    )
}

@Composable
fun MyGameCountdownLine(
    words: MyGameLabel,
    time: String,
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
        MyGameIcon(icon = MyGameIcons.hourglass, tint = lineColor)
        MyGameText(label = words, style = MyGameTypography.caption.withTabularFigures(), color = lineColor)
        MyGameText(text = time, style = MyGameTypography.heading.withTabularFigures(), color = timeColor)
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
