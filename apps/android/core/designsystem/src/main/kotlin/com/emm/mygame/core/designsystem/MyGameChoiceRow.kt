package com.emm.mygame.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight

@Composable
fun MyGameChoiceRow(
    label: String,
    isChosen: Boolean,
    isEnabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.md)
    val edge: Color = if (isChosen) colors.action else colors.lineStrong
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = MyGameSizes.secondary)
            .background(colors.surface, shape)
            .border(MyGameStrokeWidths.hairline, edge, shape)
            .selectable(selected = isChosen, enabled = isEnabled, role = Role.RadioButton, onClick = onClick)
            .padding(horizontal = MyGameSpacing.step3),
    ) {
        ChoiceMark(isChosen = isChosen, edge = edge)
        MyGameText(
            text = label,
            style = if (isChosen) MyGameTypography.gloss.copy(fontWeight = FontWeight.Bold) else MyGameTypography.gloss,
            color = colors.ink,
        )
    }
}

@Composable
private fun ChoiceMark(isChosen: Boolean, edge: Color, modifier: Modifier = Modifier) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .size(MyGameSizes.icon)
            .border(MyGameStrokeWidths.hairline, edge, CircleShape),
    ) {
        if (isChosen) {
            Box(modifier = Modifier.size(MyGameSpacing.step2).background(MyGameTheme.colors.action, CircleShape))
        }
    }
}

@PreviewMyGame
@Composable
private fun MyGameChoiceRowPreview() {
    MyGamePreviewSurface {
        MyGameChoiceRow(label = "casa", isChosen = true, isEnabled = true, onClick = {})
        MyGameChoiceRow(label = "perro", isChosen = false, isEnabled = true, onClick = {})
        MyGameChoiceRow(label = "caminar", isChosen = false, isEnabled = false, onClick = {})
    }
}
