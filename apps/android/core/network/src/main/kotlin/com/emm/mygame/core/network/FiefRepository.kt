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

    suspend fun forage(fief: FiefId, target: PlotAddress, party: List<UnitCount>, stayHours: Int): MarchResult

    suspend fun recall(fief: FiefId, departedAt: Instant): MarchResult
}

fun FiefRepository(baseUrl: String, tokenStore: TokenStore, ioDispatcher: CoroutineDispatcher): FiefRepository =
    ApiFiefRepository(
        api = defaultApi(baseUrl = baseUrl, tokenStore = tokenStore),
        ioDispatcher = ioDispatcher,
    )
