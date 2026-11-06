package com.emm.mygame.core.designsystem

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver

enum class MyGameBlockHue {
    Peach,
    Mint,
    Periwinkle,
    Lavender,
}

val BLOCK_HUE: SemanticsPropertyKey<MyGameBlockHue> = SemanticsPropertyKey("BLOCK_HUE")

internal var SemanticsPropertyReceiver.blockHue: MyGameBlockHue by BLOCK_HUE

fun blockHueOf(index: Int): MyGameBlockHue = MyGameBlockHue.entries[index % MyGameBlockHue.entries.size]

internal fun MyGameColors.groundOf(hue: MyGameBlockHue): Color = when (hue) {
    MyGameBlockHue.Peach -> blockPeach
    MyGameBlockHue.Mint -> blockMint
    MyGameBlockHue.Periwinkle -> blockPeriwinkle
    MyGameBlockHue.Lavender -> blockLavender
}
