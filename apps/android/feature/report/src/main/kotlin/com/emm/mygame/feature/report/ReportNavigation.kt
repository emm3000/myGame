package com.emm.mygame.feature.report

import com.emm.mygame.core.network.LessonId

data class ReportNavigation(
    val onReviewsOpen: () -> Unit,
    val onLessonOpen: (LessonId) -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
)
