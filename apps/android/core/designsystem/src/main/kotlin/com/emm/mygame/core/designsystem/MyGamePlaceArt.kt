package com.emm.mygame.core.designsystem

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource

@Composable
fun MyGamePlaceArt(art: MyGameArt, risenFrom: MyGameArt?, modifier: Modifier = Modifier) {
    val painter: Painter = painterResource(art.drawable)
    val frame: Size = painter.intrinsicSize
    val sized: Modifier = modifier.height(MyGameSizes.thumbnail).aspectRatio(frame.width / frame.height)
    if (risenFrom == null) {
        ArtImage(painter = painter, tint = art.tint, modifier = sized)
        return
    }
    val row: MyGameRegisteredRow =
        if (risenFrom.tint == MyGameArtTint.SurfaceSunken) MyGameRegisteredRow.Hue else MyGameRegisteredRow.Window
    val fraction: Float = rememberRegisteredFraction(row = row, key = risenFrom to art)
    Box(modifier = sized.registering(row, fraction)) {
        ArtImage(
            painter = painterResource(risenFrom.drawable),
            tint = risenFrom.tint,
            modifier = Modifier.matchParentSize(),
        )
        ArtImage(
            painter = painter,
            tint = art.tint,
            modifier = Modifier.matchParentSize().graphicsLayer { alpha = fraction },
        )
    }
}

@Composable
private fun ArtImage(painter: Painter, tint: MyGameArtTint, modifier: Modifier = Modifier) {
    val color: Color? = MyGameTheme.colors.tintOf(tint)
    Image(
        painter = painter,
        contentDescription = null,
        colorFilter = color?.let { shade: Color -> ColorFilter.tint(shade) },
        modifier = modifier,
    )
}
