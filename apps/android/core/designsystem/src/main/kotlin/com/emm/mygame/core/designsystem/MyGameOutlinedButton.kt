package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.PreviewParameter

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
    val colors: MyGameColors = MyGameTheme.colors
    MyGamePill(
        look = MyGamePillLook(
            tag = OUTLINED_PILL,
            height = MyGameSizes.secondary,
            sidePadding = MyGameSpacing.step5,
            style = MyGameTypography.label,
            ground = Color.Transparent,
            ink = colors.ink,
            edge = colors.lineStrong,
        ),
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
