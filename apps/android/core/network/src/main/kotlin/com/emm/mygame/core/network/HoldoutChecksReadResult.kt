package com.emm.mygame.core.network

sealed interface HoldoutChecksReadResult {

    data class Read(val checks: List<HoldoutCheck>) : HoldoutChecksReadResult

    data object Unreachable : HoldoutChecksReadResult
}
