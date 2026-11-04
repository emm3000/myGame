package com.emm.mygame.core.network

sealed interface ReviewHintResult {

    data class Hinted(val hint: ReviewHint) : ReviewHintResult

    data class Refused(val refusal: ReviewRefusal) : ReviewHintResult

    data object Unreachable : ReviewHintResult
}
