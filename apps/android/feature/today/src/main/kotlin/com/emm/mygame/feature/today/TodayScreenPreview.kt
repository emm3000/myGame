package com.emm.mygame.feature.today

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider
import com.emm.mygame.core.designsystem.theme.MyGamePreviewSurface
import com.emm.mygame.core.designsystem.theme.PreviewMyGame
import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.WordSupport
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSite
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNews
import com.emm.mygame.core.projection.town.building.BlockReason
import com.emm.mygame.core.projection.town.building.CostLine
import com.emm.mygame.core.projection.town.building.NextLevelLine
import com.emm.mygame.core.projection.town.building.StartStatus
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant

private val previewLesson: LessonId = LessonId("lesson-1")

private val previewAt: Instant = Instant.parse("2026-11-18T23:15:00Z")

private val previewRunningLesson: TodayUiState.RunningLesson =
    TodayUiState.RunningLesson(previewLesson, LessonName.Shelved(1), 8.minutes, previewAt)

private val previewGained: List<TownSnapshot.Cost> = listOf(
    TownSnapshot.Cost(TownResourceKind.Money, 120),
    TownSnapshot.Cost(TownResourceKind.Food, 45),
)

private val previewWhatHappened: TodayUiState.WhatHappened = TodayUiState.WhatHappened(
    events = listOf(
        TodayUiState.NewsEvent.Achievement(TownNews.BuildingWorkFinished(previewAt, TownBuildingKind.Farm, level = 2)),
        TodayUiState.NewsEvent.Plain(
            TownNews.JobBack(previewAt, TownSite(region = 1, area = 2, site = 3), pay = emptyList()),
        ),
    ),
    receivedAt = previewAt,
    close = TodayUiState.NewsClose.Idle,
)

private val previewNextLevel: NextLevelLine = NextLevelLine(
    level = 2,
    costs = listOf(CostLine(TownResourceKind.Money, amount = 50, isShort = false)),
    duration = 3.minutes,
    people = 1,
    wordsNeeded = null,
)

private val previewNavigation: TodayNavigation = TodayNavigation(
    onLessonOpen = {},
    onReviewsOpen = {},
    onHoldoutCheckOpen = { _, _ -> },
    onMapOpen = {},
    onNewsOpen = {},
    onTextOpen = {},
    onNoTown = {},
)

private class TodayStates : PreviewParameterProvider<TodayUiState> {
    override val values: Sequence<TodayUiState> = sequenceOf(
        TodayUiState.Loading,
        TodayUiState.Failed,
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.StartHere,
            first = TodayUiState.FirstCard.Study(previewLesson, number = 1),
            gained = previewGained,
            whatHappened = previewWhatHappened,
            lesson = null,
            work = null,
            job = null,
            canDo = listOf(TodayUiState.CanDo(TownBuildingKind.Farm, previewNextLevel)),
            locked = listOf(
                TodayUiState.Locked(
                    building = TownBuildingKind.School,
                    next = previewNextLevel,
                    block = BlockReason.PeopleShort(needed = 5, free = 2),
                ),
            ),
            start = TodayUiState.LessonStart.Idle,
            build = StartStatus.Idle,
            keepGoing = null,
        ),
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.StartHere,
            first = TodayUiState.FirstCard.LessonRunning(previewRunningLesson),
            gained = emptyList(),
            whatHappened = null,
            lesson = previewRunningLesson,
            work = TodayUiState.RunningWork(TownBuildingKind.Farm, level = 2, remaining = 40.minutes, previewAt),
            job = TodayUiState.JobOut(TownSnapshot.JobPhase.Outbound, remaining = 45.seconds, previewAt),
            canDo = emptyList(),
            locked = emptyList(),
            start = TodayUiState.LessonStart.Idle,
            build = StartStatus.Idle,
            keepGoing = null,
        ),
        TodayUiState.Content(
            eyebrow = TodayUiState.Eyebrow.WhatIsNext,
            first = TodayUiState.FirstCard.CaughtUp(
                line = TodayUiState.CaughtUpLine.NoReviewsDue,
                nextReview = TodayUiState.TimeAt(remaining = 3.hours, at = previewAt),
            ),
            gained = emptyList(),
            whatHappened = null,
            lesson = null,
            work = null,
            job = null,
            canDo = emptyList(),
            locked = emptyList(),
            start = TodayUiState.LessonStart.Idle,
            build = StartStatus.Idle,
            keepGoing = TodayUiState.KeepGoing.Frames(sentences = listOf(previewFrame), tapped = null),
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

private val previewFrame: List<FrameSpan> = listOf(
    FrameSpan(text = "I live by the ", support = null),
    FrameSpan(text = "river", support = WordSupport(WordSupport.Shown.Beside, "río", WordSupport.Language.Spanish)),
    FrameSpan(text = ".", support = null),
)
