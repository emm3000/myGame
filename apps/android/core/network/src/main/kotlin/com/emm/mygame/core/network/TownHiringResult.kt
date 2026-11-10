package com.emm.mygame.core.network

sealed interface TownHiringResult {

    data class Answered(val town: TownSnapshot) : TownHiringResult

    data class Refused(val refusal: TownHiringRefusal) : TownHiringResult

    data object Unreachable : TownHiringResult
}
