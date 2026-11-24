package com.emm.mygame.core.model.learning

const val REVIEW_ANSWER_MAX_LENGTH: Int = 100

interface LearningRepository {

    suspend fun reviews(): ReviewsReadResult

    suspend fun hint(word: WordId): ReviewHintResult

    suspend fun answer(word: WordId, answer: String): ReviewAnswerResult
}
