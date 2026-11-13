package com.emm.mygame.feature.report

import com.emm.mygame.core.network.LessonId

data class ReportNavigation(
    val onReviewsOpen: () -> Unit,
    val onLessonOpen: (LessonId) -> Unit,
    val onNewsOpen: () -> Unit,
    val onSettingsOpen: () -> Unit,
    val onSigningOut: () -> Unit,
    val onSignedOut: () -> Unit,
)
