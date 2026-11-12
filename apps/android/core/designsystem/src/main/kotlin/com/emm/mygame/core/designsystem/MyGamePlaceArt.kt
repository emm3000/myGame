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
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider

val PLACE_ART: SemanticsPropertyKey<MyGameArt> = SemanticsPropertyKey("PLACE_ART")

private var SemanticsPropertyReceiver.placeArt: MyGameArt by PLACE_ART

@Composable
fun MyGamePlaceArt(art: MyGameArt, risenFrom: MyGameArt?, modifier: Modifier = Modifier) {
    val painter: Painter = painterResource(art.drawable)
    val frame: Size = painter.intrinsicSize
    val sized: Modifier = modifier
        .height(MyGameSizes.thumbnail)
        .aspectRatio(frame.width / frame.height)
        .semantics { placeArt = art }
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

private data class PlaceArtState(val art: MyGameArt, val risenFrom: MyGameArt?)

private class PlaceArtStates : PreviewParameterProvider<PlaceArtState> {

    override val values: Sequence<PlaceArtState> = sequenceOf(
        PlaceArtState(
            art = MyGameArt(drawable = R.drawable.designsystem_place_farm_0, tint = MyGameArtTint.SurfaceSunken),
            risenFrom = null,
        ),
        PlaceArtState(
            art = MyGameArt(drawable = R.drawable.designsystem_place_farm_3, tint = MyGameArtTint.None),
            risenFrom = null,
        ),
        PlaceArtState(
            art = MyGameArt(drawable = R.drawable.designsystem_place_farm_3, tint = MyGameArtTint.None),
            risenFrom = MyGameArt(drawable = R.drawable.designsystem_place_farm_2, tint = MyGameArtTint.None),
        ),
        PlaceArtState(
            art = MyGameArt(drawable = R.drawable.designsystem_waste_2, tint = MyGameArtTint.InkMuted),
            risenFrom = null,
        ),
    )
}

@PreviewMyGame
@Composable
private fun MyGamePlaceArtPreview(@PreviewParameter(PlaceArtStates::class) state: PlaceArtState) {
    MyGamePreviewSurface {
        MyGamePlaceArt(art = state.art, risenFrom = state.risenFrom)
    }
}
