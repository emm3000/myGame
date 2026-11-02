package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.ApiError
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response
import com.emm.mygame.core.network.generated.models.ProvinceMap as ProvinceMapBody

internal class ApiMapRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : MapRepository {

    override suspend fun readOwn(): MapReadResult = readOf { fiefId: UUID -> api.fiefsFiefIdMapGet(fiefId) }

    override suspend fun read(province: Int): MapReadResult =
        readOf { fiefId: UUID -> api.fiefsFiefIdMapProvinceGet(fiefId, province.toString()) }

    private suspend fun readOf(request: suspend (UUID) -> Response<ProvinceMapBody>): MapReadResult =
        withContext(ioDispatcher) {
            try {
                val fiefId: UUID = api.fiefsGet().body()?.fiefs?.firstOrNull()?.id
                    ?: return@withContext MapReadResult.Unreachable
                request(fiefId).toMapReadResult()
            } catch (expectedOutage: IOException) {
                MapReadResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                MapReadResult.Unreachable
            }
        }

    private fun Response<ProvinceMapBody>.toMapReadResult(): MapReadResult {
        if (isSuccessful) {
            val map: ProvinceMap = body()?.toProvinceMap() ?: return MapReadResult.Unreachable
            return MapReadResult.Read(map)
        }
        return when (apiError()?.kind) {
            ApiError.Kind.ProvinceNotFound -> MapReadResult.ProvinceNotFound
            else -> MapReadResult.Unreachable
        }
    }
}
