package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Immutable

@Immutable
data class MyGameDockGo(
    val label: MyGameLabel,
    val isBusy: Boolean,
    val busyDescription: MyGameLabel,
    val onClick: () -> Unit,
    val blockedReason: MyGameLabel? = null,
    val badge: String? = null,
)
