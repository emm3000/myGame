package com.emm.mygame.feature.school.words

import com.emm.mygame.core.model.learning.LessonId

data class LessonWalk(val lesson: LessonId, val walked: List<LessonId>) {

    val opened: List<LessonId>
        get() = walked + lesson
}
