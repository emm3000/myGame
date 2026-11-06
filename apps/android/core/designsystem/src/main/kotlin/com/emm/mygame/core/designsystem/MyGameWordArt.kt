package com.emm.mygame.core.designsystem

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource

@Composable
fun MyGameWordArt(art: MyGameArt, modifier: Modifier = Modifier) {
    val tint: Color? = MyGameTheme.colors.tintOf(art.tint)
    Image(
        painter = painterResource(art.drawable),
        contentDescription = null,
        colorFilter = tint?.let { color: Color -> ColorFilter.tint(color) },
        modifier = modifier,
    )
}
