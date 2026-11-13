package com.emm.mygame.feature.town

import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.PlacementBand

data class TownNavigation(
    val onSchoolOpen: () -> Unit,
    val onReportOpen: () -> Unit,
    val onMapOpen: () -> Unit,
    val onReviewsOpen: () -> Unit,
    val onLessonOpen: (LessonId) -> Unit,
    val onHoldoutCheckOpen: (PlacementBand, HoldoutCheckWeek) -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
)
