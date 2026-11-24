package com.emm.mygame.core.network.report

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.network.generated.models.Report
import com.emm.mygame.core.network.generated.models.TownNewsItem
import com.emm.mygame.core.network.platform.toKotlinInstant
import com.emm.mygame.core.network.town.news.toTownNews

internal fun Report.toTownReport(): TownReport = TownReport(
    dueCount = dueCount,
    readFirst = readFirst.map(::LessonId),
    nextDueAt = nextDueAt?.toKotlinInstant(),
    news = news.mapNotNull(TownNewsItem::toTownNews),
    readAt = readAt.toKotlinInstant(),
)
