package com.emm.mygame.core.designsystem.control

import androidx.compose.foundation.LocalIndication
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.emm.mygame.core.designsystem.art.MyGameIcon
import com.emm.mygame.core.designsystem.art.MyGameIcons
import com.emm.mygame.core.designsystem.frame.dashedFrame
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGameRadii
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography

const val BLOCKED_LOCK: String = "BLOCKED_LOCK"

const val PILL_CHEVRON: String = "pill_chevron"

private val pillRingReach: Dp = MyGameSpacing.step1 + MyGameStrokeWidths.focus / 2

@Composable
internal fun MyGamePill(
    look: MyGamePillLook,
    label: MyGameLabel,
    isBusy: Boolean,
    busyDescription: MyGameLabel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: MyGameLabel? = null,
    accessibleName: String? = null,
    badge: String? = null,
    labelLineOf: (String) -> AnnotatedString = ::AnnotatedString,
    caption: MyGameLabel? = null,
) {
    val state: PillState = when {
        isBusy -> PillState.Working(busyDescription)
        blockedReason != null -> PillState.Blocked(blockedReason)
        else -> PillState.Can
    }
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier.fillMaxWidth()) {
        PillFace(
            look = look,
            text = MyGamePillText(label = label, caption = caption, labelLineOf = labelLineOf),
            state = state,
            onClick = onClick,
            accessibleName = accessibleName,
            badge = badge,
        )
        PillStateLine(state = state)
    }
}

@Composable
private fun PillFace(
    look: MyGamePillLook,
    text: MyGamePillText,
    state: PillState,
    onClick: () -> Unit,
    accessibleName: String?,
    badge: String?,
) {
    val colors: MyGameColors = MyGameTheme.colors
    val shape: Shape = RoundedCornerShape(MyGameRadii.md)
    val isQuiet: Boolean = state != PillState.Can
    val ink: Color = if (isQuiet) colors.inkMuted else look.ink
    val interactions: MutableInteractionSource = remember { MutableInteractionSource() }
    val isFocused: Boolean by interactions.collectIsFocusedAsState()
    Row(
        horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = look.height)
            .pillFocusRing(look = look, isFocused = isFocused, color = colors.focus)
            .clip(shape)
            .background(if (isQuiet) colors.surfaceSunken else look.ground)
            .edge(state = state, look = look, colors = colors, shape = shape)
            .pillSemantics(tag = look.tag, accessibleName = accessibleName, state = state.spoken)
            .clickable(
                interactionSource = interactions,
                indication = LocalIndication.current,
                enabled = state !is PillState.Working,
                role = Role.Button,
                onClick = onClick,
            )
            .padding(horizontal = look.sidePadding, vertical = MyGameSpacing.step2),
    ) {
        StateMark(state = state, ink = ink)
        Box(modifier = Modifier.weight(1f, fill = false)) {
            PillLabel(
                look = look,
                text = text,
                ink = ink,
                accessibleName = accessibleName,
                badge = badge,
            )
        }
        if (look.hasForwardChevron) PillChevron(ink = ink)
    }
}

@Composable
private fun PillChevron(ink: Color) {
    val side: Dp = with(LocalDensity.current) { MyGameSizes.iconSmall.value.sp.toDp() }
    MyGameIcon(
        icon = MyGameIcons.forward,
        tint = ink,
        modifier = Modifier.semantics { testTag = PILL_CHEVRON }.size(side),
    )
}

@Composable
private fun StateMark(state: PillState, ink: Color) {
    when (state) {
        is PillState.Working -> MyGameWorkingDots(tint = ink)
        is PillState.Blocked ->
            MyGameIcon(icon = MyGameIcons.lock, tint = ink, modifier = Modifier.semantics { testTag = BLOCKED_LOCK })
        PillState.Can -> Unit
    }
}

@Composable
private fun PillStateLine(state: PillState) {
    val colors: MyGameColors = MyGameTheme.colors
    val (line: MyGameLabel, color: Color) = when (state) {
        is PillState.Working -> state.description to colors.inkMuted
        is PillState.Blocked -> state.reason to colors.warningInk
        PillState.Can -> return
    }
    MyGameText(
        label = line,
        style = MyGameTypography.caption,
        color = color,
        modifier = Modifier.semantics { hideFromAccessibility() },
    )
}

private fun Modifier.pillFocusRing(look: MyGamePillLook, isFocused: Boolean, color: Color): Modifier =
    focusRingAround(
        isFocused = isFocused && look.hasOuterFocusRing,
        color = color,
        horizontalReach = pillRingReach,
        verticalReach = pillRingReach,
        radius = MyGameRadii.md + pillRingReach,
    )

private fun Modifier.pillSemantics(tag: String, accessibleName: String?, state: String?): Modifier =
    semantics(mergeDescendants = true) {
        testTag = tag
        if (accessibleName != null) contentDescription = accessibleName
        if (state != null) stateDescription = state
    }

private fun Modifier.edge(
    state: PillState,
    look: MyGamePillLook,
    colors: MyGameColors,
    shape: Shape,
): Modifier = when (state) {
    is PillState.Blocked -> dashedFrame(colors.lineStrong)
    is PillState.Working -> border(MyGameStrokeWidths.hairline, colors.lineStrong, shape)
    PillState.Can -> border(look.edgeWidth, look.edge, shape)
}

private sealed interface PillState {
    val spoken: String?

    data object Can : PillState {
        override val spoken: String? = null
    }

    data class Working(val description: MyGameLabel) : PillState {
        override val spoken: String = description.spoken
    }

    data class Blocked(val reason: MyGameLabel) : PillState {
        override val spoken: String = reason.spoken
    }
}
