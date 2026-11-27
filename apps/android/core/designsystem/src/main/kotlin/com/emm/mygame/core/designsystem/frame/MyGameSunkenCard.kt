package com.emm.mygame.core.designsystem.frame

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.text.MyGameWordSupport
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameRadii
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGameSunkenCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(
        verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .fillMaxWidth()
            .background(MyGameTheme.colors.surfaceSunken, RoundedCornerShape(MyGameRadii.md))
            .padding(MyGameSpacing.step4),
        content = content,
    )
}

@PreviewMyGame
@Composable
private fun MyGameSunkenCardPreview() {
    MyGamePreviewSurface {
        MyGameSunkenCard {
            MyGameFrameText(
                frame = MyGameFrame(
                    listOf(
                        MyGameFramePiece(text = "They ", support = null),
                        MyGameFramePiece(
                            text = "work",
                            support = MyGameWordSupport(isOnTap = false, text = "trabajar", languageTag = "es"),
                        ),
                        MyGameFramePiece(text = " for us.", support = null),
                    ),
                ),
                openPiece = null,
                style = MyGameTypography.reading,
                onPieceTap = {},
                ground = MyGameFrameGround.Sunken,
            )
        }
    }
}
