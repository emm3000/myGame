package com.emm.mygame.core.designsystem.navigation

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.emm.mygame.core.designsystem.art.MyGameIcon
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.frame.MyGameHairline
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.text.MyGameTitleLine
import com.emm.mygame.core.designsystem.text.englishTextOf
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameRadii
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

const val NAV_ROW_CHEVRON: String = "nav_row_chevron"

@Composable
fun MyGameNavRow(
    title: MyGameLabel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    status: MyGameLabel? = null,
    body: AnnotatedString? = null,
    caption: MyGameLabel? = null,
    captionTag: String? = null,
    titleLineOf: (String) -> AnnotatedString = ::AnnotatedString,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val interactions: MutableInteractionSource = remember { MutableInteractionSource() }
    val isFocused: Boolean by interactions.collectIsFocusedAsState()
    val chevronSize: Dp = with(LocalDensity.current) { MyGameSizes.icon.value.sp.toDp() }
    val shape: Shape = RoundedCornerShape(MyGameRadii.sm)
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step3),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = MyGameSizes.secondary)
                .focusRingWhen(isFocused = isFocused, color = colors.focus, shape = shape)
                .clip(shape)
                .clickable(
                    interactionSource = interactions,
                    indication = LocalIndication.current,
                    role = Role.Button,
                    onClick = onClick,
                )
                .padding(horizontal = MyGameSpacing.step2, vertical = MyGameSpacing.step3),
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step1),
                modifier = Modifier.weight(1f),
            ) {
                MyGameTitleLine(title = title, status = status, titleLineOf = titleLineOf)
                body?.let { line: AnnotatedString ->
                    MyGameText(text = line, style = MyGameTypography.body, color = colors.ink)
                }
                caption?.let { line: MyGameLabel ->
                    MyGameText(
                        label = line,
                        style = MyGameTypography.caption,
                        color = colors.inkMuted,
                        modifier = if (captionTag == null) Modifier else Modifier.testTag(captionTag),
                    )
                }
            }
            MyGameIcon(
                icon = MyGameIcons.forward,
                tint = colors.ink,
                modifier = Modifier.testTag(NAV_ROW_CHEVRON).size(chevronSize),
            )
        }
        MyGameHairline()
    }
}

private fun Modifier.focusRingWhen(isFocused: Boolean, color: Color, shape: Shape): Modifier =
    if (isFocused) border(MyGameStrokeWidths.focus, color, shape) else this

@PreviewMyGame
@Composable
private fun MyGameNavRowPreview() {
    MyGamePreviewSurface {
        MyGameNavRow(title = MyGameLabel(text = "Go to the school", translation = null), onClick = {})
        MyGameNavRow(
            title = MyGameLabel(text = "Lesson 2", translation = "Lección 2"),
            status = MyGameLabel(text = "Studying", translation = "Estudiando"),
            body = englishTextOf("Work and money"),
            caption = MyGameLabel(text = "5 words · Skill: money +5 %", translation = null),
            onClick = {},
        )
    }
}
