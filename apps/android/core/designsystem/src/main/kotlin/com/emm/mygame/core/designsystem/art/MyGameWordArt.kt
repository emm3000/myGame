package com.emm.mygame.core.designsystem.art

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import com.emm.mygame.core.designsystem.R
import com.emm.mygame.core.designsystem.frame.MyGameBlock
import com.emm.mygame.core.designsystem.frame.MyGameBlockHue
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

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

@PreviewMyGame
@Composable
private fun MyGameWordArtPreview() {
    MyGamePreviewSurface {
        MyGameBlock(hue = MyGameBlockHue.Mint) {
            MyGameWordArt(art = MyGameArt(drawable = R.drawable.designsystem_word_farm, tint = MyGameArtTint.OnBlock))
        }
    }
}
