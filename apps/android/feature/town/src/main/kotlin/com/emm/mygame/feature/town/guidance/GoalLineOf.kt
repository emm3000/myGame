package com.emm.mygame.feature.town.guidance

import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.feature.town.R
import com.emm.mygame.feature.town.placeNameOf

internal fun CopyReader.goalLineOf(goal: TownGoal): String = text(
    R.string.town_goal_line,
    "position" to goal.position.toString(),
    "count" to goal.count.toString(),
    "place" to text(placeNameOf(goal.building)),
    "level" to goal.level.toString(),
)
