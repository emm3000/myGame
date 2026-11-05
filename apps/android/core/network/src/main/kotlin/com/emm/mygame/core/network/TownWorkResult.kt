package com.emm.mygame.core.network

sealed interface TownWorkResult {

    data class Answered(val town: TownSnapshot) : TownWorkResult

    data class Refused(val refusal: TownWorkRefusal) : TownWorkResult

    data object Unreachable : TownWorkResult
}
