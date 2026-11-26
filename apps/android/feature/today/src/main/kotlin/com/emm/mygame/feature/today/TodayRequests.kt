package com.emm.mygame.feature.today

import com.emm.mygame.core.projection.town.building.StartStatus

internal data class TodayRequests(
    val lesson: TodayUiState.LessonStart = TodayUiState.LessonStart.Idle,
    val build: StartStatus = StartStatus.Idle,
)
