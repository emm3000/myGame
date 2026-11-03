package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.FiefChronicle
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException

internal class ApiChronicleRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : ChronicleRepository {

    override suspend fun read(fief: FiefId): ChronicleReadResult = withContext(ioDispatcher) {
        try {
            val chronicle: FiefChronicle? = api.fiefsFiefIdEventsGet(UUID.fromString(fief.value)).body()
            if (chronicle == null) {
                ChronicleReadResult.Unreachable
            } else {
                ChronicleReadResult.Read(chronicle.events.mapNotNull { it.toChronicleEvent() })
            }
        } catch (expectedOutage: IOException) {
            ChronicleReadResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            ChronicleReadResult.Unreachable
        }
    }
}
