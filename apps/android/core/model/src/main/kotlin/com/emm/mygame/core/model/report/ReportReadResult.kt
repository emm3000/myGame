package com.emm.mygame.core.model.report

sealed interface ReportReadResult {

    data class Read(val report: TownReport) : ReportReadResult

    data object Unreachable : ReportReadResult
}
