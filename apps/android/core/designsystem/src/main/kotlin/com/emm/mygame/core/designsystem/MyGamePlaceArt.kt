package com.emm.mygame.core.designsystem

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource

@Composable
fun MyGamePlaceArt(art: MyGameArt, modifier: Modifier = Modifier) {
    val painter: Painter = painterResource(art.drawable)
    val frame: Size = painter.intrinsicSize
    val tint: Color? = MyGameTheme.colors.tintOf(art.tint)
    Image(
        painter = painter,
        contentDescription = null,
        colorFilter = tint?.let { color: Color -> ColorFilter.tint(color) },
        modifier = modifier.height(MyGameSizes.placeCard).aspectRatio(frame.width / frame.height),
    )
}
