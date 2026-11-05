package com.emm.mygame.feature.school

internal data class SchoolMutations(val start: SchoolUiState.LessonRequest, val stop: SchoolUiState.LessonRequest) {

    fun keptAfterRead(): SchoolMutations = SchoolMutations(start.keptAfterRead(), stop.keptAfterRead())

    private fun SchoolUiState.LessonRequest.keptAfterRead(): SchoolUiState.LessonRequest =
        if (this == SchoolUiState.LessonRequest.Waiting) this else SchoolUiState.LessonRequest.Idle

    companion object {
        val none: SchoolMutations = SchoolMutations(SchoolUiState.LessonRequest.Idle, SchoolUiState.LessonRequest.Idle)
    }
}
