package com.emm.mygame.core.network

sealed interface HoldoutCheckChangeResult {

    data class Changed(val checks: List<HoldoutCheck>) : HoldoutCheckChangeResult

    data class Refused(val refusal: HoldoutCheckRefusal) : HoldoutCheckChangeResult

    data object Unreachable : HoldoutCheckChangeResult
}
