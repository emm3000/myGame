package com.emm.mygame.core.designsystem

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics

enum class MyGameRegisteredRow {
    Window,
    Hue,
    Deal,
    Ring,
    Rate,
}

data class MyGameRegistering(val row: MyGameRegisteredRow, val fraction: Float)

val REGISTERING: SemanticsPropertyKey<MyGameRegistering> = SemanticsPropertyKey("REGISTERING")

internal var SemanticsPropertyReceiver.registering: MyGameRegistering by REGISTERING

fun Modifier.registering(row: MyGameRegisteredRow, fraction: Float): Modifier =
    semantics { registering = MyGameRegistering(row, fraction) }

@Composable
fun rememberRegisteredFraction(row: MyGameRegisteredRow, key: Any): Float {
    val isScaledToZero: Boolean =
        rememberCoroutineScope().coroutineContext[MotionDurationScale]?.scaleFactor == 0f
    val fraction: Animatable<Float, *> = remember(key) { Animatable(if (isScaledToZero) 1f else 0f) }
    val transition: MyGameTransition = transitionOf(row)
    LaunchedEffect(key) {
        fraction.animateTo(1f, tween(durationMillis = transition.durationMillis, easing = transition.easing))
    }
    return fraction.value
}

private fun transitionOf(row: MyGameRegisteredRow): MyGameTransition = when (row) {
    MyGameRegisteredRow.Window -> MyGameTransitions.window
    MyGameRegisteredRow.Hue -> MyGameTransitions.hue
    MyGameRegisteredRow.Deal -> MyGameTransitions.deal
    MyGameRegisteredRow.Ring -> MyGameTransitions.ring
    MyGameRegisteredRow.Rate -> MyGameTransitions.rate
}
