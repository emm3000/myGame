package com.emm.mygame.core.network

sealed interface ReportReadResult {

    data class Read(val report: TownReport) : ReportReadResult

    data object Unreachable : ReportReadResult
}
