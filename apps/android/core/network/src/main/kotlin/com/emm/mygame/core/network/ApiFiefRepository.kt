package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.FiefOverview
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException

internal class ApiFiefRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : FiefRepository {

    override suspend fun read(): FiefReadResult = withContext(ioDispatcher) {
        try {
            val fiefId: UUID? = api.fiefsGet().body()?.fiefs?.firstOrNull()?.id
            val overview: FiefOverview? = fiefId?.let { api.fiefsFiefIdGet(it).body() }
            val snapshot: FiefSnapshot? = overview?.toSnapshot()
            if (snapshot == null) FiefReadResult.Unreachable else FiefReadResult.Read(snapshot)
        } catch (expectedOutage: IOException) {
            FiefReadResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            FiefReadResult.Unreachable
        }
    }
}
