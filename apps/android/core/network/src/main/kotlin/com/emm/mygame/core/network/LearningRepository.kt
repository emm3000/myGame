package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface LearningRepository {

    suspend fun reviews(): ReviewsReadResult

    suspend fun hint(word: WordId): ReviewHintResult

    suspend fun answer(word: WordId, answer: String): ReviewAnswerResult
}

fun LearningRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): LearningRepository =
    ApiLearningRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
