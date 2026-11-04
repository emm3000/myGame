package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface LearningRepository {

    suspend fun startLesson(fief: FiefId, lesson: LessonId): StudyResult

    suspend fun cancelLesson(fief: FiefId, lesson: LessonId): StudyResult

    suspend fun hint(fief: FiefId, word: WordId): ReviewHintResult

    suspend fun answer(fief: FiefId, word: WordId, answer: String): ReviewAnswerResult
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
