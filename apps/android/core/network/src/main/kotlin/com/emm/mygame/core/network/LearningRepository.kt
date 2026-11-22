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
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
): LearningRepository =
    LearningRepository(
        endpoint = ApiEndpoint(baseUrl = baseUrl, newHttpClient = okHttpDefaults),
        tokenStore = tokenStore,
        sessionEnds = sessionEnds,
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
    )

internal fun LearningRepository(
    endpoint: ApiEndpoint,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
): LearningRepository =
    ApiLearningRepository(
        api = signedInApi(endpoint = endpoint, tokenStore = tokenStore, sessionEnds = sessionEnds),
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
    )
