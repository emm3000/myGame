package com.emm.mygame.core.network

sealed interface ReportCloseResult {

    data object Closed : ReportCloseResult

    data object Unreachable : ReportCloseResult
}
