package com.emm.mygame.feature.today

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

private val previewLesson: LessonId = LessonId("lesson-1")

private val previewAt: Instant = Instant.parse("2026-11-18T23:15:00Z")

private val previewNavigation: TodayNavigation = TodayNavigation(
    onLessonOpen = {},
    onReviewsOpen = {},
    onHoldoutCheckOpen = { _, _ -> },
    onMapOpen = {},
    onNoTown = {},
)

private class TodayStates : PreviewParameterProvider<TodayUiState> {
    override val values: Sequence<TodayUiState> = sequenceOf(
        TodayUiState.Loading,
        TodayUiState.Failed,
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.StartHere,
            first = TodayUiState.FirstCard.Study(previewLesson, number = 1),
            lesson = null,
            work = null,
            job = null,
            start = TodayUiState.StartStatus.Idle,
        ),
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.StartHere,
            first = null,
            lesson = TodayUiState.RunningLesson(previewLesson, LessonName.Shelved(1), 8.minutes, previewAt),
            work = TodayUiState.RunningWork(TownBuildingKind.Farm, level = 2, remaining = 40.minutes, previewAt),
            job = TodayUiState.JobOut(TownSnapshot.JobPhase.Outbound, remaining = 45.seconds, previewAt),
            start = TodayUiState.StartStatus.Idle,
        ),
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.WhatIsNext,
            first = TodayUiState.FirstCard.CaughtUp(
                line = TodayUiState.CaughtUpLine.NoReviewsDue,
                nextReview = TodayUiState.TimeAt(remaining = 3.hours, at = previewAt),
            ),
            lesson = null,
            work = null,
            job = null,
            start = TodayUiState.StartStatus.Idle,
        ),
    )
}

@PreviewMyGame
@Composable
private fun TodayScreenPreview(@PreviewParameter(TodayStates::class) state: TodayUiState) {
    MyGamePreviewSurface {
        TodayScreen(state = state, onIntent = {}, navigation = previewNavigation)
    }
}
