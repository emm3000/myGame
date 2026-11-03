package com.emm.mygame.core.network

sealed interface MarchResult {

    data class Answered(val fief: FiefSnapshot) : MarchResult

    data class Refused(val refusal: MarchRefusal, val message: String) : MarchResult

    data object Unreachable : MarchResult
}
