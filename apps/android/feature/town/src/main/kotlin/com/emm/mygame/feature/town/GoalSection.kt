package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.emm.mygame.core.designsystem.MyGameBlock
import com.emm.mygame.core.designsystem.MyGameBlockHue
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameTextButton
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

@Composable
internal fun GoalSection(goal: TownGoal?, onIntent: (TownIntent) -> Unit, modifier: Modifier = Modifier) {
    if (goal == null) return
    val copy: PlayerCopy = rememberPlayerCopy()
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        MyGameBlock(hue = MyGameBlockHue.Lavender) {
            GoalState(goal = goal)
        }
        MyGameTextButton(
            label = copy.chrome(R.string.town_goal_close),
            isBusy = false,
            busyDescription = copy.chrome(R.string.town_waiting).spoken,
            onClick = { onIntent(TownIntent.GoalClosed) },
        )
    }
}
