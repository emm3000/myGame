package com.emm.mygame.core.network

sealed interface CancelResult {

    data class Cancelled(val fief: FiefSnapshot) : CancelResult

    data class Refused(val refusal: CancelRefusal) : CancelResult

    data object Unreachable : CancelResult
}
