package com.emm.mygame.feature.school

import com.emm.mygame.core.model.learning.LessonId

data class LessonWordsNavigation(
    val onNoTown: () -> Unit,
    val onLessonOpen: (LessonId, List<LessonId>) -> Unit,
    val onReviewsOpen: () -> Unit,
    val onSchoolOpen: () -> Unit,
)
