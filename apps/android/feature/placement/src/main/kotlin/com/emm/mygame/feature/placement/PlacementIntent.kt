package com.emm.mygame.feature.placement

import com.emm.mygame.core.network.ChoiceId

sealed interface PlacementIntent {

    data object RetryTapped : PlacementIntent

    data object StartTapped : PlacementIntent

    data object SkipTapped : PlacementIntent

    data class ChoiceChosen(val choice: ChoiceId) : PlacementIntent

    data object NextTapped : PlacementIntent

    data object BandSent : PlacementIntent
}
