package com.emm.mygame.core.network

sealed interface StudyResult {

    data class Answered(val fief: FiefSnapshot) : StudyResult

    data class Refused(val refusal: StudyRefusal) : StudyResult

    data object Unreachable : StudyResult
}
