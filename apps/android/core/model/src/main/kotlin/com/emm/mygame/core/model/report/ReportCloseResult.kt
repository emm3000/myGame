package com.emm.mygame.core.model.report

sealed interface ReportCloseResult {

    data object Closed : ReportCloseResult

    data object Unreachable : ReportCloseResult
}
