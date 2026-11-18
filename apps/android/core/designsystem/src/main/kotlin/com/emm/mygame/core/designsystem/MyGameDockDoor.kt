package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Immutable

@Immutable
data class MyGameDockDoor(val label: MyGameLabel, val onClick: () -> Unit)
