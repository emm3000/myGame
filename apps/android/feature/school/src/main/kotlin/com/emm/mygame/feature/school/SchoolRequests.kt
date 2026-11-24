package com.emm.mygame.feature.school

internal data class SchoolRequests(val start: SchoolUiState.LessonRequest, val stop: SchoolUiState.LessonRequest) {

    fun keptAfterRead(): SchoolRequests = SchoolRequests(start.keptAfterRead(), stop.keptAfterRead())

    private fun SchoolUiState.LessonRequest.keptAfterRead(): SchoolUiState.LessonRequest =
        if (this == SchoolUiState.LessonRequest.Waiting) this else SchoolUiState.LessonRequest.Idle

    companion object {
        val none: SchoolRequests = SchoolRequests(SchoolUiState.LessonRequest.Idle, SchoolUiState.LessonRequest.Idle)
    }
}
