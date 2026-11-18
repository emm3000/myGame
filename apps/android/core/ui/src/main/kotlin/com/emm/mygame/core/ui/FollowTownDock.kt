package com.emm.mygame.core.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember

@Composable
fun FollowTownDock(hook: TaskDockHook, onReviewsStart: (() -> Unit)? = null) {
    val follow: TownFollow = remember(onReviewsStart) { TownFollow(onReviewsStart) }
    SideEffect { hook.follow(follow) }
    DisposableEffect(hook) {
        onDispose { hook.follow(null) }
    }
}
