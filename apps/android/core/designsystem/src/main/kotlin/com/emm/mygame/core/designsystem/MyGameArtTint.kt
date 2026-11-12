package com.emm.mygame.core.designsystem

import androidx.compose.ui.graphics.Color

enum class MyGameArtTint {
    None,
    SurfaceSunken,
    OnBlock,
    InkMuted,
}

internal fun MyGameColors.tintOf(tint: MyGameArtTint): Color? = when (tint) {
    MyGameArtTint.None -> null
    MyGameArtTint.SurfaceSunken -> surfaceSunken
    MyGameArtTint.OnBlock -> onBlock
    MyGameArtTint.InkMuted -> inkMuted
}
