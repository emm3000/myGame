package com.emm.mygame.feature.town.building

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.RevealedAlert
import com.emm.mygame.feature.town.TownUiState

@Composable
internal fun StartAnswer(building: TownBuildingKind, start: TownUiState.StartStatus, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String? = when (start) {
        is TownUiState.StartStatus.Refused ->
            if (start.building == building) copy.fixedCopy { workRefusalLineOf(start.refusal) } else null
        is TownUiState.StartStatus.Unreachable ->
            if (start.building == building) copy.fixedCopy(R.string.town_refusal_unexpected) else null
        TownUiState.StartStatus.Idle, is TownUiState.StartStatus.Waiting -> null
    }
    if (message != null) RevealedAlert(message = message, modifier = modifier)
}
