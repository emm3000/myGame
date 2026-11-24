package com.emm.mygame.core.model.town

sealed interface TownReadResult {

    data class Read(val town: TownSnapshot) : TownReadResult

    data object NoTown : TownReadResult

    data object Unreachable : TownReadResult
}
