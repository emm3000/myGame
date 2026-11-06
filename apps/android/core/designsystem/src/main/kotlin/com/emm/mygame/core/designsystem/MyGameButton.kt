package com.emm.mygame.core.designsystem

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

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
) {
    val colors: MyGameColors = MyGameTheme.colors
    MyGamePill(
        look = MyGamePillLook(
            tag = INK_PILL,
            height = MyGameSizes.action,
            sidePadding = MyGameSpacing.step6,
            style = MyGameTypography.button,
            ground = colors.action,
            ink = colors.onAction,
            edge = colors.action,
        ),
        label = label,
        isBusy = isBusy,
        busyDescription = busyDescription,
        onClick = onClick,
        modifier = modifier,
        blockedReason = blockedReason,
        accessibleName = accessibleName,
    )
}
