package com.emm.mygame.feature.town

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameStreet
import com.emm.mygame.core.designsystem.MyGameStreetStrip
import com.emm.mygame.core.designsystem.MyGameStreetTab
import com.emm.mygame.core.model.town.TownLabel
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.building.PlaceCard
import com.emm.mygame.feature.town.building.placeArtOf

internal val streetOrder: List<TownBuildingKind> = listOf(
    TownBuildingKind.Homes,
    TownBuildingKind.Farm,
    TownBuildingKind.School,
    TownBuildingKind.Office,
    TownBuildingKind.Factory,
    TownBuildingKind.PowerStation,
    TownBuildingKind.Storage,
)

@Composable
internal fun TownStreetStrip(
    content: TownUiState.Content,
    selected: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    MyGameStreetStrip(
        street = MyGameStreet(
            tabs = content.places.map { place: PlaceCard ->
                MyGameStreetTab(
                    art = placeArtOf(place.kind, place.level),
                    name = copy.chrome { tabNameOf(place) }.spoken,
                    isNextStep = place.kind == content.nextStepPlace,
                    isInWork = place.isInWork,
                )
            },
        ),
        selected = selected,
        name = copy.chrome(
            streetNameOf(content.label),
            "built" to content.places.count { place: PlaceCard -> place.level > 0 }.toString(),
            "total" to content.places.size.toString(),
        ).spoken,
        nextStepWords = copy.chrome(R.string.town_tab_next_step).spoken,
        inWorkWords = copy.chrome(R.string.town_tab_in_work).spoken,
        onSelect = onSelect,
        modifier = modifier,
    )
}

private fun streetNameOf(label: TownLabel): Int = when (label) {
    TownLabel.Town -> R.string.town_street_built
    TownLabel.City -> R.string.town_street_built_city
}

private fun CopyReader.tabNameOf(place: PlaceCard): String = text(
    R.string.town_tab_name,
    "place" to text(placeNameOf(place.kind)),
    "level" to if (place.level == 0) {
        text(R.string.town_not_built)
    } else {
        text(R.string.town_level, "level" to place.level.toString())
    },
)
