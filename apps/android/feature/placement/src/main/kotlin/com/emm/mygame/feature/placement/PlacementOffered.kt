package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.control.MyGameInlineAlert
import com.emm.mygame.core.designsystem.control.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.fixedCopyResource

@Composable
internal fun PlacementOffered(
    offered: PlacementUiState.Offered,
    onIntent: (PlacementIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val waiting: PlacementAction? = (offered.request as? PlacementRequest.Waiting)?.action
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameText(
            text = fixedCopyResource(R.string.placement_offered_line),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = fixedCopyResource(R.string.placement_offered_skip_line),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        if (offered.request == PlacementRequest.Unreachable) {
            MyGameInlineAlert(message = fixedCopyResource(R.string.placement_unreachable))
        }
        MyGameOutlinedButton(
            label = fixedCopyResource(R.string.placement_skip),
            isBusy = waiting == PlacementAction.Skip,
            busyDescription = fixedCopyResource(R.string.placement_sending),
            onClick = { onIntent(PlacementIntent.SkipTapped) },
        )
    }
}
