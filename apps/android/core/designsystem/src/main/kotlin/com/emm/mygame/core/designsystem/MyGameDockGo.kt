package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Immutable

@Immutable
data class MyGameDockGo(
    val label: MyGameLabel,
    val isBusy: Boolean,
    val busyDescription: String,
    val onClick: () -> Unit,
    val blockedReason: String? = null,
    val badge: String? = null,
)
