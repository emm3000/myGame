package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter

const val INK_PILL: String = "ink_pill"

@Composable
fun MyGameButton(
    label: String,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: String? = null,
    accessibleName: String? = null,
    badge: String? = null,
) {
    MyGameButton(
        label = MyGameLabel(text = label, translation = null),
        isBusy = isBusy,
        busyDescription = busyDescription,
        onClick = onClick,
        modifier = modifier,
        blockedReason = blockedReason,
        accessibleName = accessibleName,
        badge = badge,
    )
}

@Composable
fun MyGameButton(
    label: MyGameLabel,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: String? = null,
    accessibleName: String? = null,
    badge: String? = null,
) {
    MyGamePill(
        look = goPillLook(MyGameTheme.colors),
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

internal fun goPillLook(colors: MyGameColors): MyGamePillLook = MyGamePillLook(
    tag = INK_PILL,
    height = MyGameSizes.action,
    sidePadding = MyGameSpacing.step6,
    style = MyGameTypography.button,
    ground = colors.go,
    ink = colors.onGo,
    edge = colors.go,
    badgeGround = colors.onGo,
    badgeInk = colors.go,
    hasOuterFocusRing = true,
)

@PreviewMyGame
@Composable
private fun MyGameButtonPreview(@PreviewParameter(MyGamePillStates::class) state: MyGamePillState) {
    MyGamePreviewSurface {
        MyGameButton(
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
private fun MyGameButtonBadgePreview() {
    MyGamePreviewSurface {
        MyGameButton(
            label = "Start the reviews",
            isBusy = false,
            busyDescription = "Opening",
            onClick = {},
            badge = "4",
        )
    }
}
