package com.emm.mygame.feature.town

import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand

data class TownDockActions(
    val onIntent: (TownStatusIntent) -> Unit,
    val onLessonOpen: (LessonId) -> Unit,
    val onSchoolOpen: () -> Unit,
    val onReviewsOpen: () -> Unit,
    val onReportOpen: () -> Unit,
    val onHoldoutCheckOpen: (PlacementBand, HoldoutCheckWeek) -> Unit,
)
