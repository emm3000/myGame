package com.emm.mygame.core.designsystem.control

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameStrokeWidths
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

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
        busyDescription = MyGameLabel(text = busyDescription, translation = null),
        onClick = onClick,
        modifier = modifier,
        blockedReason = blockedReason?.let { reason: String -> MyGameLabel(text = reason, translation = null) },
        accessibleName = accessibleName,
        badge = badge,
    )
}

@Composable
fun MyGameButton(
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
    edgeWidth = MyGameStrokeWidths.hairline,
    badgeGround = colors.onGo,
    badgeInk = colors.go,
    hasOuterFocusRing = true,
    hasForwardChevron = false,
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
