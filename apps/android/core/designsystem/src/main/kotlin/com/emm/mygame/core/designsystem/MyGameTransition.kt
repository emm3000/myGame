package com.emm.mygame.core.designsystem

import androidx.compose.animation.core.Easing
import androidx.compose.runtime.Immutable

@Immutable
data class MyGameTransition(val durationMillis: Int, val easing: Easing)
