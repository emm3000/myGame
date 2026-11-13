package com.emm.mygame.feature.school

sealed interface HoldoutCheckRowsIntent {

    data object ScreenShown : HoldoutCheckRowsIntent

    data object ScreenHidden : HoldoutCheckRowsIntent
}
