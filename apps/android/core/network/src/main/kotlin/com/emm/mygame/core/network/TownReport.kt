package com.emm.mygame.core.network

data class TownReport(val dueCount: Int, val readFirst: List<LessonId>, val news: List<TownNews>)
