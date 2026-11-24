package com.emm.mygame.core.model.learning

interface LearningRepository {

    suspend fun reviews(): ReviewsReadResult

    suspend fun hint(word: WordId): ReviewHintResult

    suspend fun answer(word: WordId, answer: String): ReviewAnswerResult
}
