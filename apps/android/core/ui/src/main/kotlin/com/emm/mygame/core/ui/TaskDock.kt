package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.Stable
import com.emm.mygame.core.designsystem.MyGameDockGo
import com.emm.mygame.core.designsystem.MyGameDockLine

@Stable
class TaskDock(
    val line: MyGameDockLine,
    val go: MyGameDockGo,
    val countdown: @Composable () -> Unit = {},
    val notice: @Composable () -> Unit = {},
)
