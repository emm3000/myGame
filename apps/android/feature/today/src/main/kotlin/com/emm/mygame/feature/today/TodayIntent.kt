package com.emm.mygame.feature.today

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.building.TownBuildingKind

sealed interface TodayIntent {

    data object ScreenShown : TodayIntent

    data object ScreenHidden : TodayIntent

    data object ScreenLeft : TodayIntent

    data object RetryTapped : TodayIntent

    data class StudyTapped(val lesson: LessonId) : TodayIntent

    data object NewsCloseTapped : TodayIntent

    data class BuildTapped(val building: TownBuildingKind) : TodayIntent

    data class FrameWordTapped(val at: TodayUiState.SpanAt) : TodayIntent
}
