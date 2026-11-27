package com.emm.mygame.feature.town.building

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.art.MyGamePlaceTile
import com.emm.mygame.core.designsystem.control.MyGameGoOutlinedButton
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.placeNameOf

@Composable
internal fun PlaceTile(
    place: PlaceCard,
    start: StartStatus,
    onIntent: (TownIntent) -> Unit,
    onOpen: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val startable: NextLevelLine? = place.next?.takeIf { place.block == null }
    MyGamePlaceTile(
        art = placeArtOf(place.kind, place.level),
        name = copy.chrome(placeNameOf(place.kind)),
        level = copy.levelOf(place),
        state = copy.stateOf(place),
        onOpen = onOpen,
        modifier = modifier,
    ) {
        if (startable == null) return@MyGamePlaceTile
        MyGameGoOutlinedButton(
            label = copy.chrome {
                text(
                    R.string.town_build_for,
                    "cost" to listPhraseOf(
                        startable.costs.map { cost: CostLine -> amountLineOf(cost.kind, cost.amount) },
                    ),
                )
            },
            isBusy = start == StartStatus.Waiting(place.kind),
            busyDescription = copy.chrome(R.string.town_sending),
            onClick = { onIntent(TownIntent.BuildTapped(place.kind)) },
        )
        StartAnswer(building = place.kind, start = start)
    }
}

private fun PlayerCopy.levelOf(place: PlaceCard): MyGameLabel {
    if (place.level == 0) return chrome(R.string.town_not_built)
    return chrome(R.string.town_level, "level" to place.level.toString())
}

private fun PlayerCopy.stateOf(place: PlaceCard): MyGameLabel {
    if (place.isInWork) return chrome(R.string.town_in_work)
    val next: NextLevelLine = place.next ?: return chrome(R.string.town_top_level)
    return place.block?.let { block: BlockReason -> blockLineOf(block) }
        ?: chrome(R.string.town_card_ready, "level" to next.level.toString())
}
