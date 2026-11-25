package com.emm.mygame.feature.school

import com.emm.mygame.core.model.learning.LessonId

internal data class SchoolTaps(val requests: SchoolRequests, val selected: LessonId?) {

    fun keptAfterRead(): SchoolTaps = copy(requests = requests.keptAfterRead())

    companion object {
        val none: SchoolTaps = SchoolTaps(SchoolRequests.none, selected = null)
    }
}
