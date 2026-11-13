package com.emm.mygame.feature.town

internal data class TownMutations(
    val start: TownUiState.StartStatus,
    val stop: TownUiState.StopStatus,
    val hire: TownUiState.HireStatus,
    val hireStop: TownUiState.HireStopStatus,
    val lessonStart: TownUiState.LessonStartStatus,
) {

    fun keptAfterRead(): TownMutations = TownMutations(
        start = if (start is TownUiState.StartStatus.Waiting) start else TownUiState.StartStatus.Idle,
        stop = if (stop is TownUiState.StopStatus.Waiting) stop else TownUiState.StopStatus.Idle,
        hire = if (hire is TownUiState.HireStatus.Waiting) hire else TownUiState.HireStatus.Idle,
        hireStop = if (hireStop == TownUiState.HireStopStatus.Waiting) hireStop else TownUiState.HireStopStatus.Idle,
        lessonStart = if (lessonStart == TownUiState.LessonStartStatus.Waiting) {
            lessonStart
        } else {
            TownUiState.LessonStartStatus.Idle
        },
    )

    fun startAnswered(): TownMutations = keptAfterRead().copy(start = TownUiState.StartStatus.Idle)

    fun stopAnswered(): TownMutations = keptAfterRead().copy(stop = TownUiState.StopStatus.Idle)

    fun hireAnswered(): TownMutations = keptAfterRead().copy(hire = TownUiState.HireStatus.Idle)

    fun hireStopAnswered(): TownMutations = keptAfterRead().copy(hireStop = TownUiState.HireStopStatus.Idle)

    fun lessonStartAnswered(): TownMutations = keptAfterRead().copy(lessonStart = TownUiState.LessonStartStatus.Idle)

    companion object {
        val none: TownMutations = TownMutations(
            start = TownUiState.StartStatus.Idle,
            stop = TownUiState.StopStatus.Idle,
            hire = TownUiState.HireStatus.Idle,
            hireStop = TownUiState.HireStopStatus.Idle,
            lessonStart = TownUiState.LessonStartStatus.Idle,
        )
    }
}
