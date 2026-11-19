package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameLabel

@Stable
class TaskDock(
    val step: MyGameLabel,
    val go: MyGameDockGo,
    val notice: @Composable () -> Unit = {},
)
