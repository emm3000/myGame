package com.emm.mygame.core.designsystem

import androidx.compose.animation.core.EaseOut

object MyGameTransitions {
    val track: MyGameTransition = MyGameTransition(durationMillis = 400, easing = EaseOut)
}
