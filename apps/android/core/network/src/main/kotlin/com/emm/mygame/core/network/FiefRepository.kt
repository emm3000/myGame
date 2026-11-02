package com.emm.mygame.core.network

import kotlinx.coroutines.CoroutineDispatcher

interface FiefRepository {

    suspend fun read(): FiefReadResult

    suspend fun upgrade(fief: FiefId, building: BuildingKind): UpgradeResult

    suspend fun cancel(fief: FiefId, building: BuildingKind, targetLevel: Int): CancelResult

    suspend fun startStudy(fief: FiefId, art: ArtKind): StudyResult

    suspend fun cancelStudy(fief: FiefId, art: ArtKind, targetLevel: Int): StudyResult
}

fun FiefRepository(baseUrl: String, tokenStore: TokenStore, ioDispatcher: CoroutineDispatcher): FiefRepository =
    ApiFiefRepository(
        api = defaultApi(baseUrl = baseUrl, tokenStore = tokenStore),
        ioDispatcher = ioDispatcher,
    )
