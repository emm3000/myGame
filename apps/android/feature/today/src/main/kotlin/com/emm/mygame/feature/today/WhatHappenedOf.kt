package com.emm.mygame.feature.today

import com.emm.mygame.core.model.town.news.TownNews
import kotlin.time.Instant

private const val EVENTS_DRAWN: Int = 3

internal fun whatHappenedOf(
    news: List<TownNews>,
    receivedAt: Instant,
    close: TodayUiState.NewsClose,
): TodayUiState.WhatHappened? {
    if (news.isEmpty()) return null
    return TodayUiState.WhatHappened(news.take(EVENTS_DRAWN).map(::newsEventOf), receivedAt, close)
}

internal fun newsEventOf(news: TownNews): TodayUiState.NewsEvent = when (news) {
    is TownNews.BuildingWorkFinished,
    is TownNews.LessonStudied,
    is TownNews.SkillEarned,
    is TownNews.BecameCity,
    -> TodayUiState.NewsEvent.Achievement(news)
    is TownNews.BuildingWorkStopped,
    is TownNews.LessonStopped,
    is TownNews.HiringDelivered,
    is TownNews.HiringStopped,
    is TownNews.JobBack,
    is TownNews.JobCalledBack,
    is TownNews.CleanUpDone,
    is TownNews.CleanUpFailed,
    -> TodayUiState.NewsEvent.Plain(news)
}
