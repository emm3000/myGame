package com.emm.mygame.core.designsystem.control

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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameRadii
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

@Composable
fun MyGameChoiceRow(
    label: String,
    isChosen: Boolean,
    isEnabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    look: MyGameChoiceLook = MyGameChoiceLook.Answer,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: RoundedCornerShape = RoundedCornerShape(MyGameRadii.md)
    val edge: Color = if (isChosen) colors.action else colors.lineStrong
    val measures: ChoiceMeasures = measuresOf(look)
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = measures.minHeight)
            .background(colors.surface, shape)
            .border(MyGameStrokeWidths.hairline, edge, shape)
            .selectable(selected = isChosen, enabled = isEnabled, role = Role.RadioButton, onClick = onClick)
            .padding(horizontal = MyGameSpacing.step3, vertical = measures.verticalPadding),
    ) {
        ChoiceMark(isChosen = isChosen, edge = edge, measures = measures)
        MyGameText(
            text = label,
            style = if (isChosen) measures.chosenStyle else measures.style,
            color = if (isEnabled) colors.ink else colors.inkMuted,
        )
    }
}

private class ChoiceMeasures(
    val minHeight: Dp,
    val verticalPadding: Dp,
    val markSize: Dp,
    val markEdge: Dp,
    val style: TextStyle,
    val chosenStyle: TextStyle,
)

private val answerMeasures: ChoiceMeasures = ChoiceMeasures(
    minHeight = MyGameSizes.secondary,
    verticalPadding = MyGameSpacing.step0,
    markSize = MyGameSizes.icon,
    markEdge = MyGameStrokeWidths.hairline,
    style = MyGameTypography.gloss,
    chosenStyle = MyGameTypography.gloss.copy(fontWeight = FontWeight.Bold),
)

private val settingMeasures: ChoiceMeasures = ChoiceMeasures(
    minHeight = MyGameSizes.control + MyGameSpacing.step2,
    verticalPadding = MyGameSpacing.step2,
    markSize = MyGameSizes.iconSmall,
    markEdge = MyGameStrokeWidths.control,
    style = MyGameTypography.body,
    chosenStyle = MyGameTypography.body,
)

private fun measuresOf(look: MyGameChoiceLook): ChoiceMeasures = when (look) {
    MyGameChoiceLook.Answer -> answerMeasures
    MyGameChoiceLook.Setting -> settingMeasures
}

@Composable
private fun ChoiceMark(isChosen: Boolean, edge: Color, measures: ChoiceMeasures, modifier: Modifier = Modifier) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier
            .size(measures.markSize)
            .border(measures.markEdge, edge, CircleShape),
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
        MyGameChoiceRow(
            label = "Spanish",
            isChosen = true,
            isEnabled = true,
            onClick = {},
            look = MyGameChoiceLook.Setting,
        )
        MyGameChoiceRow(
            label = "None",
            isChosen = false,
            isEnabled = true,
            onClick = {},
            look = MyGameChoiceLook.Setting,
        )
    }
}
