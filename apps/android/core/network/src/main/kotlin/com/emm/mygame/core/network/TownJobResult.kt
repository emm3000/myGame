package com.emm.mygame.core.network

sealed interface TownJobResult {

    data class Answered(val town: TownSnapshot) : TownJobResult

    data class Refused(val refusal: TownJobRefusal) : TownJobResult

    data object Unreachable : TownJobResult
}
