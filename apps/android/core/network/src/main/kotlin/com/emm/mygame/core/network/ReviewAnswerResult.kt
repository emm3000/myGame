package com.emm.mygame.core.network

sealed interface ReviewAnswerResult {

    data class Answered(val verdict: ReviewVerdict, val fief: FiefSnapshot) : ReviewAnswerResult

    data class Refused(val refusal: ReviewRefusal) : ReviewAnswerResult

    data object Unreachable : ReviewAnswerResult
}
