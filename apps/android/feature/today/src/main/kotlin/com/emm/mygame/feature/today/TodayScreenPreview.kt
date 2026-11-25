package com.emm.mygame.feature.today

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.PreviewMyGame
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.LessonName
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

private val previewLesson: LessonId = LessonId("lesson-1")

private val previewAt: Instant = Instant.parse("2026-11-18T23:15:00Z")

private val previewNavigation: TodayNavigation = TodayNavigation(
    onLessonOpen = {},
    onReviewsOpen = {},
    onHoldoutCheckOpen = { _, _ -> },
    onNoTown = {},
)

private class TodayStates : PreviewParameterProvider<TodayUiState> {
    override val values: Sequence<TodayUiState> = sequenceOf(
        TodayUiState.Loading,
        TodayUiState.Failed,
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.StartHere,
            first = TodayUiState.FirstCard.Study(previewLesson, number = 1),
            running = null,
            start = TodayUiState.StartStatus.Idle,
        ),
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.StartHere,
            first = null,
            running = TodayUiState.RunningLesson(previewLesson, LessonName.Shelved(1), 8.minutes, previewAt),
            start = TodayUiState.StartStatus.Idle,
        ),
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.WhatIsNext,
            first = TodayUiState.FirstCard.CaughtUp(
                line = TodayUiState.CaughtUpLine.NoReviewsDue,
                nextReview = TodayUiState.TimeAt(remaining = 3.hours, at = previewAt),
            ),
            running = null,
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
