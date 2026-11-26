package com.emm.mygame.feature.town.building

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.projection.town.building.StartStatus
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.RevealedAlert

@Composable
internal fun StartAnswer(building: TownBuildingKind, start: StartStatus, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String? = when (start) {
        is StartStatus.Refused ->
            if (start.building == building) copy.fixedCopy { workRefusalLineOf(start.refusal) } else null
        is StartStatus.Unreachable ->
            if (start.building == building) copy.fixedCopy(R.string.town_refusal_unexpected) else null
        StartStatus.Idle, is StartStatus.Waiting -> null
    }
    if (message != null) RevealedAlert(message = message, modifier = modifier)
}
