package com.emm.mygame.feature.holdout

sealed interface HoldoutCheckRowsIntent {

    data object ScreenShown : HoldoutCheckRowsIntent

    data object ScreenHidden : HoldoutCheckRowsIntent
}
