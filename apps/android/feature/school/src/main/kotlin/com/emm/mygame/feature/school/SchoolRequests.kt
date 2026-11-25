package com.emm.mygame.feature.school

internal data class SchoolRequests(
    val start: SchoolUiState.LessonRequestStatus,
    val stop: SchoolUiState.LessonRequestStatus,
) {

    fun keptAfterRead(): SchoolRequests = SchoolRequests(start.keptAfterRead(), stop.keptAfterRead())

    private fun SchoolUiState.LessonRequestStatus.keptAfterRead(): SchoolUiState.LessonRequestStatus =
        if (this == SchoolUiState.LessonRequestStatus.Waiting) this else SchoolUiState.LessonRequestStatus.Idle

    companion object {
        val none: SchoolRequests =
            SchoolRequests(SchoolUiState.LessonRequestStatus.Idle, SchoolUiState.LessonRequestStatus.Idle)
    }
}
