package com.emm.mygame.feature.report.news

import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.news.TownNews
import kotlin.time.Instant

internal val readInstant: Instant = Instant.parse("2026-11-05T09:10:00Z")

internal val finishedFarm: TownNews =
    TownNews.BuildingWorkFinished(readInstant, TownBuildingKind.Farm, level = 2)

internal val stoppedLesson: TownNews = TownNews.LessonStopped(readInstant)
