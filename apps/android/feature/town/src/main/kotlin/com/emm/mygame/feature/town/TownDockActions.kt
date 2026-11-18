package com.emm.mygame.feature.town

import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.PlacementBand

data class TownDockActions(
    val onIntent: (TownStatusIntent) -> Unit,
    val onLessonOpen: (LessonId) -> Unit,
    val onSchoolOpen: () -> Unit,
    val onReviewsOpen: () -> Unit,
    val onReportOpen: () -> Unit,
    val onHoldoutCheckOpen: (PlacementBand, HoldoutCheckWeek) -> Unit,
)
