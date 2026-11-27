package com.emm.mygame.feature.town.building.work

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.control.MyGameOutlinedButton
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.RevealedAlert
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.building.workRefusalLineOf
import com.emm.mygame.feature.town.placeNameOf

@Composable
internal fun StopControl(
    target: WorkTarget,
    stop: StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        MyGameText(
            label = copy.chrome(R.string.town_work_refund),
            style = MyGameTypography.caption,
            color = MyGameTheme.colors.inkMuted,
        )
        MyGameOutlinedButton(
            label = copy.chrome(R.string.town_work_stop),
            isBusy = stop is StopStatus.Waiting,
            busyDescription = copy.chrome(R.string.town_sending),
            onClick = { onIntent(TownIntent.StopTapped(target.building, target.level)) },
            accessibleName = copy.chrome {
                text(
                    R.string.town_work_stop_of,
                    "place" to text(placeNameOf(target.building)),
                    "level" to target.level.toString(),
                )
            }.spoken,
        )
        StopAnswer(target = target, stop = stop)
    }
}

@Composable
private fun StopAnswer(target: WorkTarget, stop: StopStatus, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val message: String? = when (stop) {
        is StopStatus.Refused ->
            if (stop.target == target) copy.fixedCopy { workRefusalLineOf(stop.refusal) } else null
        is StopStatus.Unreachable ->
            if (stop.target == target) copy.fixedCopy(R.string.town_refusal_unexpected) else null
        StopStatus.Idle, is StopStatus.Waiting -> null
    }
    if (message != null) RevealedAlert(message = message, modifier = modifier)
}
