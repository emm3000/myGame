package com.emm.mygame.core.model.learning

sealed interface ReviewAnswerResult {

    data class Answered(val verdict: ReviewVerdict) : ReviewAnswerResult

    data class Refused(val refusal: ReviewRefusal) : ReviewAnswerResult

    data object Unreachable : ReviewAnswerResult
}
