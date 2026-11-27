package com.emm.mygame.feature.town.building.work

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.text.MyGameText
import com.emm.mygame.core.designsystem.theme.MyGameSpacing
import com.emm.mygame.core.designsystem.theme.MyGameTheme
import com.emm.mygame.core.designsystem.theme.MyGameTypography
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.core.ui.finishLabelOf
import com.emm.mygame.core.ui.rememberPlayerCopy
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.TownIntent
import com.emm.mygame.feature.town.placeNameOf
import com.emm.mygame.feature.town.townDurationCopy

@Composable
internal fun WaitingItem(
    waiting: WaitingLine,
    stop: StopStatus,
    onIntent: (TownIntent) -> Unit,
    modifier: Modifier = Modifier,
) {
    val target: WorkTarget = WorkTarget(waiting.building, waiting.level)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step2), modifier = modifier) {
        FlowRow(
            horizontalArrangement = Arrangement.SpaceBetween,
            itemVerticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(MyGameSpacing.step2),
            ) {
                MyGameText(
                    label = chromeResource(placeNameOf(target.building)),
                    style = MyGameTypography.body,
                    color = MyGameTheme.colors.ink,
                )
                WorkLevel(level = target.level)
            }
            if (waiting.remaining.isPositive()) {
                RunningCountdown(
                    label = rememberPlayerCopy().chrome {
                        finishLabelOf(waiting.remaining, waiting.finishesAt, townDurationCopy)
                    },
                )
            } else {
                FinishedCountdown()
            }
        }
        StopControl(target = target, stop = stop, onIntent = onIntent)
    }
}

@Composable
private fun FinishedCountdown(modifier: Modifier = Modifier) {
    MyGameText(
        label = chromeResource(R.string.town_work_ready),
        style = MyGameTypography.caption,
        color = MyGameTheme.colors.ink,
        modifier = modifier,
    )
}
