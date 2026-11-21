package com.emm.mygame.core.designsystem

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
import androidx.compose.ui.layout.AlignmentLine
import androidx.compose.ui.layout.FirstBaseline
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.layout.Measurable
import androidx.compose.ui.layout.MeasurePolicy
import androidx.compose.ui.layout.MeasureResult
import androidx.compose.ui.layout.MeasureScope
import androidx.compose.ui.layout.Placeable
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.constrainWidth
import androidx.compose.ui.unit.sp

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
                NavRowTitle(title = title, status = status, titleLineOf = titleLineOf)
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

@Composable
private fun NavRowTitle(
    title: MyGameLabel,
    status: MyGameLabel?,
    titleLineOf: (String) -> AnnotatedString,
    modifier: Modifier = Modifier,
) {
    val colors: MyGameColors = MyGameTheme.colors
    Layout(
        content = {
            MyGameText(label = title, style = MyGameTypography.title, color = colors.ink, styledLineOf = titleLineOf)
            status?.let { line: MyGameLabel ->
                MyGameText(label = line, style = MyGameTypography.caption, color = colors.inkMuted)
            }
        },
        measurePolicy = TitleBesideStatus,
        modifier = modifier,
    )
}

private object TitleBesideStatus : MeasurePolicy {
    override fun MeasureScope.measure(measurables: List<Measurable>, constraints: Constraints): MeasureResult {
        val title: Measurable = measurables.first()
        val status: Measurable = measurables.getOrNull(1)
            ?: return placeAlone(title.measure(constraints.copy(minWidth = 0)))
        val gap: Int = MyGameSpacing.step3.roundToPx()
        val titleWidest: Int = title.maxIntrinsicWidth(constraints.maxHeight)
        val statusWidest: Int = status.maxIntrinsicWidth(constraints.maxHeight)
        val room: Int = if (constraints.hasBoundedWidth) constraints.maxWidth - gap else titleWidest + statusWidest
        val titleShare: Int = titleShareOf(
            room = room,
            titleWidest = titleWidest,
            statusWidest = statusWidest,
            statusLongestWord = status.minIntrinsicWidth(constraints.maxHeight),
        )
        val titlePlaced: Placeable = title.measure(
            Constraints(maxWidth = titleShare, maxHeight = constraints.maxHeight),
        )
        val statusPlaced: Placeable = status.measure(
            Constraints(maxWidth = (room - titlePlaced.width).coerceAtLeast(0), maxHeight = constraints.maxHeight),
        )
        return placeOnOneBaseline(titlePlaced, statusPlaced, gap, constraints)
    }
}

private fun titleShareOf(room: Int, titleWidest: Int, statusWidest: Int, statusLongestWord: Int): Int {
    if (titleWidest + statusWidest <= room) return titleWidest
    return minOf(titleWidest, maxOf(room - statusLongestWord, room / 2)).coerceAtLeast(0)
}

private fun MeasureScope.placeAlone(title: Placeable): MeasureResult =
    layout(title.width, title.height) { title.placeRelative(0, 0) }

private fun MeasureScope.placeOnOneBaseline(
    title: Placeable,
    status: Placeable,
    gap: Int,
    constraints: Constraints,
): MeasureResult {
    val baseline: Int = maxOf(firstBaselineOf(title), firstBaselineOf(status))
    val titleTop: Int = baseline - firstBaselineOf(title)
    val statusTop: Int = baseline - firstBaselineOf(status)
    val width: Int = constraints.constrainWidth(title.width + gap + status.width)
    val height: Int = maxOf(titleTop + title.height, statusTop + status.height)
    return layout(width, height) {
        title.placeRelative(0, titleTop)
        status.placeRelative(title.width + gap, statusTop)
    }
}

private fun firstBaselineOf(placeable: Placeable): Int {
    val baseline: Int = placeable[FirstBaseline]
    return if (baseline == AlignmentLine.Unspecified) 0 else baseline
}

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
