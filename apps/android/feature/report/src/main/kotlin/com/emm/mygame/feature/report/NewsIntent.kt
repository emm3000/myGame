package com.emm.mygame.feature.report

sealed interface NewsIntent {

    data object RetryTapped : NewsIntent
}
