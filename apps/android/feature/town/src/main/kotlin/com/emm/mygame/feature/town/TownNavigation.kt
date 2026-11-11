package com.emm.mygame.feature.town

import com.emm.mygame.core.network.LessonId

data class TownNavigation(
    val onSchoolOpen: () -> Unit,
    val onReportOpen: () -> Unit,
    val onMapOpen: () -> Unit,
    val onReviewsOpen: () -> Unit,
    val onLessonOpen: (LessonId) -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
)
