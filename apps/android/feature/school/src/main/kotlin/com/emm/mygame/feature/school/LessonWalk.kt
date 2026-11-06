package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId

data class LessonWalk(val lesson: LessonId, val walked: List<LessonId>) {

    val opened: List<LessonId>
        get() = walked + lesson
}
