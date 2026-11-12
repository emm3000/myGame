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
fun MyGameBlockStack(
    nearHue: MyGameBlockHue?,
    farHue: MyGameBlockHue?,
    dealtKey: Any?,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val fraction: Float = if (dealtKey == null) 1f else rememberRegisteredFraction(MyGameRegisteredRow.Deal, dealtKey)
    val dealt: Modifier = if (dealtKey == null) {
        Modifier
    } else {
        Modifier.rotate(-STACK_TURN_DEGREES * (1 - fraction)).registering(MyGameRegisteredRow.Deal, fraction)
    }
    Box(modifier = modifier.fillMaxWidth()) {
        farHue?.let { hue: MyGameBlockHue -> StackedBlock(hue = hue, degrees = STACK_TURN_DEGREES) }
        nearHue?.let { hue: MyGameBlockHue -> StackedBlock(hue = hue, degrees = -STACK_TURN_DEGREES) }
        Box(modifier = dealt) {
            content()
        }
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

@PreviewMyGame
@Composable
private fun MyGameBlockStackPreview() {
    MyGamePreviewSurface {
        MyGameBlockStack(nearHue = MyGameBlockHue.Mint, farHue = MyGameBlockHue.Lavender, dealtKey = null) {
            MyGameBlock(hue = MyGameBlockHue.Peach) {
                MyGameText(text = "harvest", style = MyGameTypography.display, color = MyGameTheme.colors.onBlock)
            }
        }
    }
}
