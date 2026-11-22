package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.StateFlow

interface TownRepository :
    RegionRepository,
    TownGuidanceRepository {

    val town: StateFlow<HeldTown?>

    suspend fun read(): TownReadResult

    suspend fun readSentAfterNow(): TownReadResult

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
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
    clock: Clock,
): TownRepository =
    TownRepository(
        endpoint = ApiEndpoint(baseUrl = baseUrl, newHttpClientBuilder = okHttpDefaults),
        tokenStore = tokenStore,
        languages = languages,
        sessionEnds = sessionEnds,
        studyAnswers = studyAnswers,
        ioDispatcher = ioDispatcher,
        clock = clock,
    )

internal fun TownRepository(
    endpoint: ApiEndpoint,
    tokenStore: TokenStore,
    languages: PlayerLanguages,
    sessionEnds: SessionEnds,
    studyAnswers: StudyAnswers,
    ioDispatcher: CoroutineDispatcher,
    clock: Clock,
): TownRepository {
    val api: DefaultApi = signedInApi(endpoint = endpoint, tokenStore = tokenStore, sessionEnds = sessionEnds)
    val answers = TownAnswers(tokenStore = tokenStore, languages = languages, studyAnswers = studyAnswers)
    return ApiTownRepository(
        api = api,
        ioDispatcher = ioDispatcher,
        clock = clock,
        answers = answers,
        reads = TownReadFlight(flights = CoroutineScope(SupervisorJob() + ioDispatcher), answers = answers),
        regionReader = ApiRegionReader(api = api, ioDispatcher = ioDispatcher),
        guidance = ApiTownGuidance(api = api, ioDispatcher = ioDispatcher),
    )
}
