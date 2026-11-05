package com.emm.mygame.core.network

sealed interface TownFoundResult {

    data class Founded(val town: TownSnapshot) : TownFoundResult

    data class Refused(val refusal: TownFoundRefusal) : TownFoundResult

    data object Unreachable : TownFoundResult
}
