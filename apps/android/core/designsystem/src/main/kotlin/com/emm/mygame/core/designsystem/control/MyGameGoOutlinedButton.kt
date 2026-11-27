package com.emm.mygame.core.designsystem.control

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.designsystem.theme.MyGameColors
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.MyGameSizes
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.PreviewMyGame

const val GO_OUTLINED_PILL: String = "go_outlined_pill"

@Composable
fun MyGameGoOutlinedButton(
    label: String,
    isBusy: Boolean,
    busyDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: String? = null,
    accessibleName: String? = null,
) {
    MyGameGoOutlinedButton(
        label = MyGameLabel(text = label, translation = null),
        isBusy = isBusy,
        busyDescription = MyGameLabel(text = busyDescription, translation = null),
        onClick = onClick,
        modifier = modifier,
        blockedReason = blockedReason?.let { reason: String -> MyGameLabel(text = reason, translation = null) },
        accessibleName = accessibleName,
    )
}

@Composable
fun MyGameGoOutlinedButton(
    label: MyGameLabel,
    isBusy: Boolean,
    busyDescription: MyGameLabel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    blockedReason: MyGameLabel? = null,
    accessibleName: String? = null,
) {
    MyGamePill(
        look = goOutlinedPillLook(MyGameTheme.colors),
        label = label,
        isBusy = isBusy,
        busyDescription = busyDescription,
        onClick = onClick,
        modifier = modifier,
        blockedReason = blockedReason,
        accessibleName = accessibleName,
        badge = null,
    )
}

internal fun goOutlinedPillLook(colors: MyGameColors): MyGamePillLook =
    outlinedPillLook(colors = colors, height = MyGameSizes.secondary).copy(tag = GO_OUTLINED_PILL, edge = colors.go)

@PreviewMyGame
@Composable
private fun MyGameGoOutlinedButtonPreview(@PreviewParameter(MyGamePillStates::class) state: MyGamePillState) {
    MyGamePreviewSurface {
        MyGameGoOutlinedButton(
            label = state.label,
            isBusy = state.isBusy,
            busyDescription = state.busyDescription,
            onClick = {},
            blockedReason = state.blockedReason,
        )
    }
}
