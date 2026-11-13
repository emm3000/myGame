package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.StateFlow

interface TownRepository :
    RegionRepository,
    TownGuidanceRepository {

    val town: StateFlow<HeldTown?>

    suspend fun read(): TownReadResult

    suspend fun found(name: String): TownFoundResult

    suspend fun startWork(building: TownBuildingKind): TownWorkResult

    suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult

    suspend fun startLesson(lesson: LessonId): TownLessonResult

    suspend fun stopLesson(lesson: LessonId): TownLessonResult

    suspend fun placeHiring(hire: TownHireKind, count: Int): TownHiringResult

    suspend fun stopHiring(hire: TownHireKind, startedAt: Instant): TownHiringResult
}

fun TownRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    languages: PlayerLanguages,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
    clock: Clock,
): TownRepository {
    val api: DefaultApi = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds)
    return ApiTownRepository(
        api = api,
        ioDispatcher = ioDispatcher,
        clock = clock,
        tokenStore = tokenStore,
        languages = languages,
        regionReader = ApiRegionReader(api = api, ioDispatcher = ioDispatcher),
        guidance = ApiTownGuidance(api = api, ioDispatcher = ioDispatcher),
    )
}
