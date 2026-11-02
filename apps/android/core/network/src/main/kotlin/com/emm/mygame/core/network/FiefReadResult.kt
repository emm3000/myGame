package com.emm.mygame.core.network

sealed interface FiefReadResult {

    data class Read(val fief: FiefSnapshot) : FiefReadResult

    data object Unreachable : FiefReadResult
}
