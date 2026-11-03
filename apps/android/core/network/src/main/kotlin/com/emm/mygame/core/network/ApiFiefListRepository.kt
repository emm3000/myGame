package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.FiefList
import com.emm.mygame.core.network.generated.models.FiefListFiefsInner
import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException

internal class ApiFiefListRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : FiefListRepository {

    override suspend fun firstListed(): FirstFiefResult = withContext(ioDispatcher) {
        try {
            val listed: FiefList = api.fiefsGet().body() ?: return@withContext FirstFiefResult.Unreachable
            val first: FiefListFiefsInner = listed.fiefs.firstOrNull() ?: return@withContext FirstFiefResult.NoFief
            FirstFiefResult.Listed(FiefId(first.id.toString()))
        } catch (expectedOutage: IOException) {
            FirstFiefResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            FirstFiefResult.Unreachable
        }
    }
}
