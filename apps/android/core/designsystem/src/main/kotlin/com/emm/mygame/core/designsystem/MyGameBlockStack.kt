package com.emm.mygame.core.designsystem

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics

private const val STACK_TURN_DEGREES: Float = 2f

@Composable
fun MyGameBlockStack(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(modifier = modifier.fillMaxWidth()) {
        StackedBlock(hue = MyGameBlockHue.Mint, degrees = STACK_TURN_DEGREES)
        StackedBlock(hue = MyGameBlockHue.Lavender, degrees = -STACK_TURN_DEGREES)
        content()
    }
}

@Composable
private fun BoxScope.StackedBlock(hue: MyGameBlockHue, degrees: Float, modifier: Modifier = Modifier) {
    MyGameBlock(
        hue = hue,
        modifier = modifier
            .matchParentSize()
            .rotate(degrees)
            .semantics { hideFromAccessibility() },
    ) { }
}
