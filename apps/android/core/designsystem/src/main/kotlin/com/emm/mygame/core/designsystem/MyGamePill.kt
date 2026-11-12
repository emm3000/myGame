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
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.tooling.preview.PreviewParameterProvider

val PILL_BADGE: SemanticsPropertyKey<String> = SemanticsPropertyKey("PILL_BADGE")

private var SemanticsPropertyReceiver.pillBadge: String by PILL_BADGE

@Composable
internal fun MyGamePill(
    look: MyGamePillLook,
    label: String,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: String? = null,
    accessibleName: String? = null,
    badge: String? = null,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.pill)
    val isBlocked: Boolean = blockedReason != null && !isBusy
    val isQuiet: Boolean = isBusy || isBlocked
    val ink: Color = if (isQuiet) colors.inkMuted else look.ink
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = look.height)
            .clip(shape)
            .background(if (isQuiet) colors.surfaceSunken else look.ground)
            .edge(isBlocked = isBlocked, isBusy = isBusy, look = look, colors = colors, shape = shape)
            .pillSemantics(
                tag = look.tag,
                accessibleName = accessibleName,
                state = if (isBusy) busyDescription else blockedReason,
            )
            .clickable(enabled = !isBusy, role = Role.Button, onClick = onClick)
            .padding(horizontal = look.sidePadding),
    ) {
        if (isBusy) MyGameIcon(icon = MyGameIcons.hourglass, tint = ink)
        MyGameText(
            text = label,
            style = look.style,
            color = ink,
            modifier = if (accessibleName == null) Modifier else Modifier.clearAndSetSemantics { },
        )
        badge?.let { figure: String -> PillBadge(figure = figure, shape = shape) }
    }
}

@Composable
private fun PillBadge(figure: String, shape: Shape, modifier: Modifier = Modifier) {
    val colors: MyGameColors = MyGameTheme.colors
    MyGameText(
        text = figure,
        style = MyGameTypography.label.withTabularFigures(),
        color = colors.onAction,
        modifier = modifier
            .clearAndSetSemantics { pillBadge = figure }
            .clip(shape)
            .background(colors.action)
            .padding(horizontal = MyGameSpacing.step2),
    )
}

private fun Modifier.pillSemantics(tag: String, accessibleName: String?, state: String?): Modifier =
    semantics(mergeDescendants = true) {
        testTag = tag
        if (accessibleName != null) contentDescription = accessibleName
        if (state != null) stateDescription = state
    }

private fun Modifier.edge(
    isBlocked: Boolean,
    isBusy: Boolean,
    look: MyGamePillLook,
    colors: MyGameColors,
    shape: Shape,
): Modifier = when {
    isBlocked -> dashedFrame(colors.lineStrong)
    isBusy -> border(MyGameStrokeWidths.hairline, colors.lineStrong, shape)
    else -> border(MyGameStrokeWidths.hairline, look.edge, shape)
}

internal data class MyGamePillState(
    val label: String,
    val isBusy: Boolean,
    val busyDescription: String,
    val blockedReason: String?,
)

internal class MyGamePillStates : PreviewParameterProvider<MyGamePillState> {

    override val values: Sequence<MyGamePillState> = sequenceOf(
        MyGamePillState(label = "Build the farm", isBusy = false, busyDescription = "Building", blockedReason = null),
        MyGamePillState(
            label = "Build the farm",
            isBusy = false,
            busyDescription = "Building",
            blockedReason = "Not enough material",
        ),
        MyGamePillState(label = "Build the farm", isBusy = true, busyDescription = "Building", blockedReason = null),
    )
}
