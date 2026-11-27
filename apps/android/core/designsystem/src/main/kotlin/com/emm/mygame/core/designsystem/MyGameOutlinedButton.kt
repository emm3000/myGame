package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.unit.Dp

const val OUTLINED_PILL: String = "outlined_pill"

@Composable
fun MyGameOutlinedButton(
    label: String,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: String? = null,
    accessibleName: String? = null,
    badge: String? = null,
) {
    MyGameOutlinedButton(
        label = MyGameLabel(text = label, translation = null),
        isBusy = isBusy,
        busyDescription = MyGameLabel(text = busyDescription, translation = null),
        onClick = onClick,
        modifier = modifier,
        blockedReason = blockedReason?.let { reason: String -> MyGameLabel(text = reason, translation = null) },
        accessibleName = accessibleName,
        badge = badge,
    )
}

@Composable
fun MyGameOutlinedButton(
    label: MyGameLabel,
    isBusy: Boolean,
    busyDescription: MyGameLabel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: MyGameLabel? = null,
    accessibleName: String? = null,
    badge: String? = null,
) {
    MyGamePill(
        look = outlinedPillLook(colors = MyGameTheme.colors, height = MyGameSizes.secondary),
        label = label,
        isBusy = isBusy,
        busyDescription = busyDescription,
        onClick = onClick,
        modifier = modifier,
        blockedReason = blockedReason,
        accessibleName = accessibleName,
        badge = badge,
    )
}

internal fun outlinedPillLook(colors: MyGameColors, height: Dp): MyGamePillLook = MyGamePillLook(
    tag = OUTLINED_PILL,
    height = height,
    sidePadding = MyGameSpacing.step5,
    style = MyGameTypography.label,
    ground = Color.Transparent,
    ink = colors.ink,
    edge = colors.ink,
    edgeWidth = MyGameStrokeWidths.control,
    badgeGround = colors.action,
    badgeInk = colors.onAction,
    hasOuterFocusRing = true,
    hasForwardChevron = false,
)

@PreviewMyGame
@Composable
private fun MyGameOutlinedButtonPreview(@PreviewParameter(MyGamePillStates::class) state: MyGamePillState) {
    MyGamePreviewSurface {
        MyGameOutlinedButton(
            label = state.label,
            isBusy = state.isBusy,
            busyDescription = state.busyDescription,
            onClick = {},
            blockedReason = state.blockedReason,
        )
    }
}

@PreviewMyGame
@Composable
private fun MyGameOutlinedButtonBadgePreview() {
    MyGamePreviewSurface {
        MyGameOutlinedButton(
            label = "Review your words",
            isBusy = false,
            busyDescription = "Opening",
            onClick = {},
            badge = "3",
        )
    }
}
