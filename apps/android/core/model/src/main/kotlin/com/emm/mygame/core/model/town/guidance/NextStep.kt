package com.emm.mygame.core.model.town.guidance

import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand

sealed interface NextStep {

    data class Reviews(val count: Int, val readFirst: List<LessonId>) : NextStep

    data class HoldoutCheck(val band: PlacementBand, val week: HoldoutCheckWeek) : NextStep

    data class LessonRunning(val goal: TownGoal?, val text: NextStepText?) : NextStep

    data class ReleasedLesson(val lesson: LessonId, val band: PlacementBand, val position: Int) : NextStep

    data class LessonToStudy(val lesson: LessonId) : NextStep

    data class CaughtUp(val reason: CaughtUpReason, val goal: TownGoal?, val text: NextStepText?) : NextStep
}
