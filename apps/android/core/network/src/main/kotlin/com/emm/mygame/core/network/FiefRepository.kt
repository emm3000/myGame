package com.emm.mygame.core.network

import kotlin.time.Instant
import kotlinx.coroutines.CoroutineDispatcher

interface FiefRepository {

    suspend fun read(): FiefReadResult

    suspend fun upgrade(fief: FiefId, building: BuildingKind): UpgradeResult

    suspend fun cancel(fief: FiefId, building: BuildingKind, targetLevel: Int): CancelResult

    suspend fun startStudy(fief: FiefId, art: ArtKind): StudyResult

    suspend fun cancelStudy(fief: FiefId, art: ArtKind, targetLevel: Int): StudyResult

    suspend fun recruit(fief: FiefId, unit: UnitKind, count: Int): RecruitResult

    suspend fun cancelRecruit(fief: FiefId, unit: UnitKind, startedAt: Instant): RecruitResult

    suspend fun dispatch(fief: FiefId, march: MarchDispatch): MarchResult

    suspend fun recall(fief: FiefId, departedAt: Instant): MarchResult
}

fun FiefRepository(
    baseUrl: String,
    tokenStore: TokenStore,
    sessionEnds: SessionEnds,
    ioDispatcher: CoroutineDispatcher,
): FiefRepository =
    ApiFiefRepository(
        api = signedInApi(baseUrl = baseUrl, tokenStore = tokenStore, sessionEnds = sessionEnds),
        ioDispatcher = ioDispatcher,
    )
