package com.emm.mygame.feature.today

import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.placement.PlacementBand

data class TodayNavigation(
    val onLessonOpen: (LessonId) -> Unit,
    val onReviewsOpen: () -> Unit,
    val onHoldoutCheckOpen: (PlacementBand, HoldoutCheckWeek) -> Unit,
    val onMapOpen: () -> Unit,
    val onNoTown: () -> Unit,
)
