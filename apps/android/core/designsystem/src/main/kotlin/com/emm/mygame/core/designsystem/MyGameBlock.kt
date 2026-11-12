package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider

@Composable
fun MyGameBlock(hue: MyGameBlockHue, modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .fillMaxWidth()
            .semantics { blockHue = hue }
            .background(MyGameTheme.colors.groundOf(hue), RoundedCornerShape(MyGameRadii.lg))
            .padding(MyGameSpacing.step6),
        content = content,
    )
}

private class BlockHues : PreviewParameterProvider<MyGameBlockHue> {

    override val values: Sequence<MyGameBlockHue> = MyGameBlockHue.entries.asSequence()
}

@PreviewMyGame
@Composable
private fun MyGameBlockPreview(@PreviewParameter(BlockHues::class) hue: MyGameBlockHue) {
    MyGamePreviewSurface {
        MyGameBlock(hue = hue) {
            MyGameMetaText(text = "Lesson 1", color = MyGameTheme.colors.onBlockMuted)
            MyGameText(text = "At the market", style = MyGameTypography.display, color = MyGameTheme.colors.onBlock)
        }
    }
}
