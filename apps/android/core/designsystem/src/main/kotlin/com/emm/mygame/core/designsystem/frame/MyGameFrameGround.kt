package com.emm.mygame.core.designsystem.frame

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import com.emm.mygame.core.designsystem.theme.MyGameTheme

enum class MyGameFrameGround { Block, Sunken }

@Composable
@ReadOnlyComposable
internal fun MyGameFrameGround.ink(): Color = when (this) {
    MyGameFrameGround.Block -> MyGameTheme.colors.onBlock
    MyGameFrameGround.Sunken -> MyGameTheme.colors.ink
}

@Composable
@ReadOnlyComposable
internal fun MyGameFrameGround.inkMuted(): Color = when (this) {
    MyGameFrameGround.Block -> MyGameTheme.colors.onBlockMuted
    MyGameFrameGround.Sunken -> MyGameTheme.colors.inkMuted
}
