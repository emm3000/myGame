package com.emm.mygame.feature.placement

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography

@Composable
internal fun PlacementOffered(
    offered: PlacementUiState.Offered,
    onIntent: (PlacementIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val waiting: PlacementAction? = (offered.request as? PlacementRequest.Waiting)?.action
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step4), modifier = modifier) {
        MyGameText(
            text = stringResource(R.string.placement_offered_line),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.ink,
        )
        MyGameText(
            text = stringResource(R.string.placement_offered_skip_line),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        if (offered.request == PlacementRequest.Unreachable) {
            MyGameInlineAlert(message = stringResource(R.string.placement_unreachable))
        }
        MyGameButton(
            label = stringResource(R.string.placement_start),
            isBusy = waiting == PlacementAction.Begin,
            busyDescription = stringResource(R.string.placement_sending),
            onClick = { onIntent(PlacementIntent.StartTapped) },
        )
        MyGameOutlinedButton(
            label = stringResource(R.string.placement_skip),
            isBusy = waiting == PlacementAction.Skip,
            busyDescription = stringResource(R.string.placement_sending),
            onClick = { onIntent(PlacementIntent.SkipTapped) },
        )
    }
}
