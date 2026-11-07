package com.emm.mygame.feature.town

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.MyGamePlaceArt
import com.emm.mygame.core.designsystem.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.ui.icuStringResource

private const val PLACE_WIDTH: Float = 100f

private const val PLACE_HEIGHT: Float = 142f

private const val PLACE_STEP: Float = 72f

private val placesAlongTheLine: List<TownBuildingKind> = listOf(
    TownBuildingKind.Homes,
    TownBuildingKind.Farm,
    TownBuildingKind.School,
    TownBuildingKind.Office,
    TownBuildingKind.Factory,
    TownBuildingKind.PowerStation,
    TownBuildingKind.Storage,
)

private val skylineWidth: Float = PLACE_STEP * (placesAlongTheLine.size - 1) + PLACE_WIDTH

@Composable
internal fun TownSkyline(content: TownUiState.Content, modifier: Modifier = Modifier) {
    val places: List<TownUiState.PlaceCard?> = placesAlongTheLine.map { kind: TownBuildingKind ->
        content.places.firstOrNull { place: TownUiState.PlaceCard -> place.kind == kind }
    }
    val levels: List<Int> = places.map { place: TownUiState.PlaceCard? -> place?.level ?: 0 }
    val description: String = icuStringResource(
        R.string.town_skyline_built,
        "built" to levels.count { level: Int -> level > 0 }.toString(),
        "total" to placesAlongTheLine.size.toString(),
    )
    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(skylineWidth / PLACE_HEIGHT)
            .clearAndSetSemantics { contentDescription = description },
    ) {
        val unit: Dp = maxWidth / skylineWidth
        placesAlongTheLine.forEachIndexed { index: Int, kind: TownBuildingKind ->
            MyGamePlaceArt(
                art = placeArtOf(kind, levels[index]),
                risenFrom = places[index]?.raisedFrom?.let { levelBefore: Int -> placeArtOf(kind, levelBefore) },
                modifier = Modifier
                    .offset(x = unit * PLACE_STEP * index)
                    .width(unit * PLACE_WIDTH)
                    .fillMaxHeight(),
            )
        }
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .height(MyGameStrokeWidths.mark)
                .background(MyGameTheme.colors.ink),
        )
    }
}
