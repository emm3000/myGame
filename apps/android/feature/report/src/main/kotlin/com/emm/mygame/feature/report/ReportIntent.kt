package com.emm.mygame.feature.report

sealed interface ReportIntent {

    data object ScreenShown : ReportIntent

    data object ScreenHidden : ReportIntent

    data object RetryTapped : ReportIntent

    data object CloseTapped : ReportIntent

    data object SignOutTapped : ReportIntent
}
