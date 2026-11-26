package com.emm.mygame.core.model.learning

sealed interface KeepGoingResult {

    data class Read(val words: List<KeepGoingWord>) : KeepGoingResult

    data object NoTown : KeepGoingResult

    data object Unreachable : KeepGoingResult
}
