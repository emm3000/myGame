package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface TownRepository {

    suspend fun read(): TownReadResult

    suspend fun found(name: String): TownFoundResult

    suspend fun startWork(building: TownBuildingKind): TownWorkResult

    suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult

    suspend fun startLesson(lesson: LessonId): TownLessonResult

    suspend fun stopLesson(lesson: LessonId): TownLessonResult
}

fun TownRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): TownRepository =
    ApiTownRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
