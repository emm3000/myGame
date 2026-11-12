package com.emm.mygame.feature.town

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
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
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun goalLineOf(goal: TownGoal): String = icuStringResource(
    R.string.town_goal_line,
    "position" to goal.position.toString(),
    "count" to goal.count.toString(),
    "place" to stringResource(placeNameOf(goal.building)),
    "level" to goal.level.toString(),
)

@Composable
internal fun GoalState(goal: TownGoal, modifier: Modifier = Modifier) {
    val lines: List<String> = stateLinesOf(goal.state)
    Column(verticalArrangement = Arrangement.spacedBy(MyGameSpacing.step3), modifier = modifier) {
        lines.forEach { line: String ->
            MyGameText(text = line, style = MyGameTypography.body, color = MyGameTheme.colors.onBlock)
        }
    }
}

@Composable
private fun stateLinesOf(state: TownGoal.State): List<String> = when (state) {
    TownGoal.State.Underway -> listOf(stringResource(R.string.town_in_work))
    is TownGoal.State.Pending -> pendingLinesOf(state)
}

@Composable
private fun pendingLinesOf(pending: TownGoal.State.Pending): List<String> {
    if (pending.resources.isEmpty() && pending.people == 0) return listOf(stringResource(R.string.town_goal_ready))
    val resources: String? = if (pending.resources.isEmpty()) {
        null
    } else {
        shortfallLineOf(pending.resources.toShortfalls())
    }
    val people: String? = if (pending.people == 0) {
        null
    } else {
        icuStringResource(R.string.town_goal_people, "count" to pending.people.toString())
    }
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
        MyGameNextStepBlock(title = "Your next step", line = "No reviews due now.", detail = goalLineOf(goal)) {
            GoalState(goal = goal)
        }
    }
}
