package com.emm.mygame.core.testing

import com.emm.mygame.core.network.PlacementAnswer
import com.emm.mygame.core.network.PlacementBand

sealed interface PlacementChange {

    data object Begin : PlacementChange

    data object Skip : PlacementChange

    data class Answer(val band: PlacementBand, val answers: List<PlacementAnswer>) : PlacementChange
}
