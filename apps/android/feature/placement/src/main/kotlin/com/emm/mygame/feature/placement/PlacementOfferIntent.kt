package com.emm.mygame.feature.placement

sealed interface PlacementOfferIntent {

    data object ScreenShown : PlacementOfferIntent

    data object ScreenHidden : PlacementOfferIntent
}
