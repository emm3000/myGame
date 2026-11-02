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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
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
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    val ground: Color = if (isBusy) colors.surfaceSunken else colors.umber
    val edge: Color = if (isBusy) colors.lineStrong else colors.umber
    val ink: Color = if (isBusy) colors.inkMuted else colors.onUmber
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = MyGameSizes.control)
            .clip(shape)
            .background(ground)
            .border(MyGameSizes.hairline, edge, shape)
            .semantics(mergeDescendants = true) {
                if (isBusy) stateDescription = busyDescription
            }
            .clickable(enabled = !isBusy, role = Role.Button, onClick = onClick)
            .padding(horizontal = MyGameSpacing.step4),
    ) {
        if (isBusy) MyGameIcon(icon = MyGameIcons.hourglass, tint = ink)
        MyGameText(text = label, style = MyGameTypography.action, color = ink)
    }
}
