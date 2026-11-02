package com.emm.mygame.core.network

sealed interface RecruitResult {

    data class Answered(val fief: FiefSnapshot) : RecruitResult

    data class Refused(val refusal: RecruitRefusal) : RecruitResult

    data object Unreachable : RecruitResult
}
