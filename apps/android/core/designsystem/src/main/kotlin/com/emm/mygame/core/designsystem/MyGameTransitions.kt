package com.emm.mygame.core.designsystem

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing

object MyGameTransitions {
    const val INSTANT_MILLIS: Int = 0
    const val QUICK_MILLIS: Int = 120
    const val BASE_MILLIS: Int = 200
    const val CALM_MILLIS: Int = 320
    val standard: Easing = CubicBezierEasing(0.2f, 0f, 0f, 1f)
    val exit: Easing = CubicBezierEasing(0.3f, 0f, 1f, 1f)
    val track: MyGameTransition = MyGameTransition(durationMillis = CALM_MILLIS, easing = standard)
    val window: MyGameTransition = MyGameTransition(durationMillis = CALM_MILLIS, easing = standard)
    val hue: MyGameTransition = MyGameTransition(durationMillis = CALM_MILLIS, easing = standard)
    val deal: MyGameTransition = MyGameTransition(durationMillis = CALM_MILLIS, easing = standard)
    val ring: MyGameTransition = MyGameTransition(durationMillis = CALM_MILLIS, easing = standard)
    val rate: MyGameTransition = MyGameTransition(durationMillis = CALM_MILLIS, easing = standard)
}
