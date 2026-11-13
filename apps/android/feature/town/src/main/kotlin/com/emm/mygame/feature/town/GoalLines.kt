package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.designsystem.MyGameNextStepBlock
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.MyGameSpacing
import com.emm.mygame.core.designsystem.MyGameText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTypography
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy
import com.emm.mygame.core.ui.rememberPlayerCopy

internal fun CopyReader.goalLineOf(goal: TownGoal): String = text(
    R.string.town_goal_line,
    "position" to goal.position.toString(),
    "count" to goal.count.toString(),
    "place" to text(placeNameOf(goal.building)),
    "level" to goal.level.toString(),
)

@Composable
internal fun GoalState(goal: TownGoal, modifier: Modifier = Modifier) {
    val copy: PlayerCopy = rememberPlayerCopy()
    val lines: List<MyGameLabel> = copy.stateLinesOf(goal.state)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        lines.forEach { line: MyGameLabel ->
            MyGameText(label = line, style = MyGameTypography.body, color = MyGameTheme.colors.onBlock)
        }
    }
}

private fun PlayerCopy.stateLinesOf(state: TownGoal.State): List<MyGameLabel> = when (state) {
    TownGoal.State.Underway -> listOf(chrome(R.string.town_in_work))
    is TownGoal.State.Pending -> pendingLinesOf(state)
}

private fun PlayerCopy.pendingLinesOf(pending: TownGoal.State.Pending): List<MyGameLabel> {
    if (pending.resources.isEmpty() && pending.people == 0) return listOf(chrome(R.string.town_goal_ready))
    val resources: MyGameLabel? =
        if (pending.resources.isEmpty()) null else chrome { shortfallLineOf(pending.resources.toShortfalls()) }
    val people: MyGameLabel? =
        if (pending.people == 0) null else chrome(R.string.town_goal_people, "count" to pending.people.toString())
    return listOfNotNull(resources, people)
}

private fun List<TownSnapshot.Cost>.toShortfalls(): TownUiState.BlockReason.Resources =
    TownUiState.BlockReason.Resources(
        shortfalls = map { cost: TownSnapshot.Cost -> TownUiState.Shortfall(cost.kind, cost.amount) },
        ready = null,
    )

private class GoalStates : PreviewParameterProvider<TownGoal> {

    override val values: Sequence<TownGoal> = sequenceOf(
        TownGoal(
            position = 2,
            count = 9,
            building = TownBuildingKind.Factory,
            level = 1,
            state = TownGoal.State.Pending(
                resources = listOf(
                    TownSnapshot.Cost(TownResourceKind.Money, 45),
                    TownSnapshot.Cost(TownResourceKind.Material, 65),
                ),
                people = 2,
            ),
        ),
        TownGoal(
            position = 1,
            count = 9,
            building = TownBuildingKind.Farm,
            level = 1,
            state = TownGoal.State.Pending(resources = emptyList(), people = 0),
        ),
        TownGoal(
            position = 3,
            count = 9,
            building = TownBuildingKind.PowerStation,
            level = 1,
            state = TownGoal.State.Underway,
        ),
    )
}

@PreviewMyGame
@Composable
private fun GoalStatePreview(@PreviewParameter(GoalStates::class) goal: TownGoal) {
    MyGamePreviewSurface {
        MyGameNextStepBlock(
            title = MyGameLabel(text = "Your next step", translation = null),
            line = MyGameLabel(text = "No reviews due now.", translation = null),
            detail = rememberPlayerCopy().chrome { goalLineOf(goal) },
        ) {
            GoalState(goal = goal)
        }
    }
}
