package com.emm.mygame.feature.report.news

sealed interface NewsIntent {

    data object RetryTapped : NewsIntent
}
