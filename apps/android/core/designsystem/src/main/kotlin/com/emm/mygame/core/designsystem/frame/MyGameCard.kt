package com.emm.mygame.core.designsystem.frame

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameRadii
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGameCard(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.lg)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.surfaceRaised, shape)
            .padding(horizontal = MyGameSpacing.step4, vertical = MyGameSpacing.step1),
    ) {
        content()
    }
}

@PreviewMyGame
@Composable
private fun MyGameCardPreview() {
    MyGamePreviewSurface {
        MyGameCard {
            MyGameText(text = "No news yet.", style = MyGameTypography.body, color = MyGameTheme.colors.ink)
            MyGameHairline()
            MyGameText(text = "Your town is quiet.", style = MyGameTypography.body, color = MyGameTheme.colors.inkMuted)
        }
    }
}
