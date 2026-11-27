package com.emm.mygame.feature.school.words

import androidx.compose.runtime.Composable
import com.emm.mygame.core.designsystem.text.MyGameLabel
import com.emm.mygame.core.ui.chromeResource
import com.emm.mygame.feature.school.R

@Composable
internal fun wayOnLabelOf(wayOn: LessonWordsUiState.WayOn): MyGameLabel = when (wayOn) {
    is LessonWordsUiState.WayOn.Lesson -> chromeResource(R.string.school_lesson_next)
    LessonWordsUiState.WayOn.Reviews -> chromeResource(R.string.school_start_reviews)
}
