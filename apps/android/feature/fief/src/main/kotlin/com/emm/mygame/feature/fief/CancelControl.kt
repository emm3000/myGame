package com.emm.mygame.feature.fief

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.emm.mygame.core.designsystem.MyGameButton
import com.emm.mygame.core.designsystem.MyGameInlineAlert
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun CancelControl(
    target: FiefUiState.UpgradeTarget,
    cancel: FiefUiState.CancelStatus,
    onIntent: (FiefIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val building: String = stringResource(buildingNameOf(target.building)).lowercase(spanish)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameButton(
            label = stringResource(R.string.cancel_upgrade),
            isBusy = cancel is FiefUiState.CancelStatus.Waiting,
            busyDescription = stringResource(R.string.building_waiting),
            onClick = { onIntent(FiefIntent.CancelTapped(target.building, target.targetLevel)) },
            accessibleName = icuStringResource(
                R.string.cancel_upgrade_description,
                "building" to building,
                "level" to target.targetLevel.toString(),
            ),
        )
        MyGameText(
            text = stringResource(R.string.cancel_refund),
            style = MyGameTypography.body,
            color = MyGameTheme.colors.inkMuted,
        )
        CancelAnswer(target = target, cancel = cancel)
    }
}

@Composable
private fun CancelAnswer(
    target: FiefUiState.UpgradeTarget,
    cancel: FiefUiState.CancelStatus,
    modifier: Modifier = Modifier,
) {
    val isUnanswered: Boolean = when (cancel) {
        is FiefUiState.CancelStatus.Refused -> cancel.target == target
        is FiefUiState.CancelStatus.Unreachable -> cancel.target == target
        FiefUiState.CancelStatus.Idle, is FiefUiState.CancelStatus.Waiting -> false
    }
    if (isUnanswered) MyGameInlineAlert(message = stringResource(R.string.fief_unreachable), modifier = modifier)
}
