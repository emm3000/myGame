package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription

@Composable
fun MyGameButton(
    label: String,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: String? = null,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    val isBlocked: Boolean = blockedReason != null && !isBusy
    val isQuiet: Boolean = isBusy || isBlocked
    val ground: Color = if (isQuiet) colors.surfaceSunken else colors.umber
    val ink: Color = if (isQuiet) colors.inkMuted else colors.onUmber
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = MyGameSizes.control)
            .clip(shape)
            .background(ground)
            .edge(isBlocked = isBlocked, isBusy = isBusy, colors = colors, shape = shape)
            .semantics(mergeDescendants = true) {
                if (isBusy) stateDescription = busyDescription
                if (blockedReason != null && !isBusy) stateDescription = blockedReason
            }
            .clickable(enabled = !isBusy, role = Role.Button, onClick = onClick)
            .padding(horizontal = MyGameSpacing.step4),
    ) {
        if (isBusy) MyGameIcon(icon = MyGameIcons.hourglass, tint = ink)
        MyGameText(text = label, style = MyGameTypography.action, color = ink)
    }
}

private fun Modifier.edge(isBlocked: Boolean, isBusy: Boolean, colors: MyGameColors, shape: Shape): Modifier = when {
    isBlocked -> drawBehind {
        val stroke: Float = MyGameSizes.hairline.toPx()
        val dash: Float = MyGameSizes.dash.toPx()
        val radius: Float = MyGameRadii.md.toPx()
        drawRoundRect(
            color = colors.lineStrong,
            topLeft = Offset(stroke / 2, stroke / 2),
            size = Size(size.width - stroke, size.height - stroke),
            cornerRadius = CornerRadius(radius, radius),
            style = Stroke(width = stroke, pathEffect = PathEffect.dashPathEffect(floatArrayOf(dash, dash))),
        )
    }
    isBusy -> border(MyGameSizes.hairline, colors.lineStrong, shape)
    else -> border(MyGameSizes.hairline, colors.umber, shape)
}
