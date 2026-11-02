package com.emm.mygame.core.network

sealed interface ChronicleReadResult {

    data class Read(val events: List<ChronicleEvent>) : ChronicleReadResult

    data object Unreachable : ChronicleReadResult
}
