package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role

@Composable
fun MyGameSwitchRow(
    label: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    supportingText: String? = null,
    isEnabled: Boolean = true,
) {
    MyGameSwitchRow(
        label = MyGameLabel(text = label, translation = null),
        isChecked = isChecked,
        onCheckedChange = onCheckedChange,
        modifier = modifier,
        supportingText = supportingText?.let { line: String -> MyGameLabel(text = line, translation = null) },
        isEnabled = isEnabled,
    )
}

@Composable
fun MyGameSwitchRow(
    label: MyGameLabel,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    supportingText: MyGameLabel? = null,
    isEnabled: Boolean = true,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val ink: Color = if (isEnabled) colors.ink else colors.inkMuted
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = MyGameSizes.control)
            .clip(RoundedCornerShape(MyGameRadii.md))
            .background(if (isEnabled) colors.surface else colors.surfaceSunken)
            .toggleable(value = isChecked, enabled = isEnabled, role = Role.Switch, onValueChange = onCheckedChange)
            .padding(horizontal = MyGameSpacing.step3, vertical = MyGameSpacing.step2),
    ) {
        Column(modifier = Modifier.weight(1f)) {
            MyGameText(label = label, style = MyGameTypography.gloss, color = ink)
            supportingText?.let { line: MyGameLabel ->
                MyGameText(label = line, style = MyGameTypography.caption, color = colors.inkMuted)
            }
        }
        SwitchMark(look = switchMarkLookOf(isChecked = isChecked, isEnabled = isEnabled, colors = colors))
    }
}

private data class SwitchMarkLook(
    val isChecked: Boolean,
    val trackFill: Color,
    val trackEdge: Color,
    val thumb: Color,
)

private fun switchMarkLookOf(isChecked: Boolean, isEnabled: Boolean, colors: MyGameColors): SwitchMarkLook = when {
    !isChecked -> SwitchMarkLook(
        isChecked = false,
        trackFill = Color.Transparent,
        trackEdge = colors.lineStrong,
        thumb = colors.lineStrong,
    )
    isEnabled -> SwitchMarkLook(
        isChecked = true,
        trackFill = colors.action,
        trackEdge = colors.action,
        thumb = colors.onAction,
    )
    else -> SwitchMarkLook(
        isChecked = true,
        trackFill = colors.lineStrong,
        trackEdge = colors.lineStrong,
        thumb = colors.surfaceSunken,
    )
}

@Composable
private fun SwitchMark(look: SwitchMarkLook, modifier: Modifier = Modifier) {
    val track: Shape = RoundedCornerShape(MyGameRadii.pill)
    Box(
        contentAlignment = if (look.isChecked) Alignment.CenterEnd else Alignment.CenterStart,
        modifier = modifier
            .size(width = MyGameSizes.control, height = MyGameSizes.icon)
            .clip(track)
            .background(look.trackFill)
            .border(MyGameStrokeWidths.control, look.trackEdge, track)
            .padding(MyGameStrokeWidths.control),
    ) {
        Box(modifier = Modifier.size(MyGameSizes.iconSmall).background(look.thumb, CircleShape))
    }
}

@PreviewMyGame
@Composable
private fun MyGameSwitchRowPreview() {
    MyGamePreviewSurface {
        MyGameSwitchRow(
            label = "Study reminder",
            supportingText = "Once a day, at the time you pick, when there is something to study.",
            isChecked = true,
            onCheckedChange = {},
        )
        MyGameSwitchRow(label = "Study reminder", isChecked = false, onCheckedChange = {})
        MyGameSwitchRow(label = "Study reminder", isChecked = true, isEnabled = false, onCheckedChange = {})
        MyGameSwitchRow(label = "Study reminder", isChecked = false, isEnabled = false, onCheckedChange = {})
        MyGameSwitchRow(
            label = MyGameLabel(
                text = "Remind me once a day when my words are ready to review",
                translation = "Recuérdame una vez al día cuando mis palabras estén listas",
            ),
            isChecked = false,
            onCheckedChange = {},
        )
    }
}
