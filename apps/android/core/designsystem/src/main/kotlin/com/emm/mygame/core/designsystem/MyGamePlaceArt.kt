package com.emm.mygame.core.designsystem

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource

@Composable
fun MyGamePlaceArt(@DrawableRes art: Int, modifier: Modifier = Modifier) {
    Image(
        painter = painterResource(art),
        contentDescription = null,
        modifier = modifier.size(MyGameSizes.placeCard),
    )
}
