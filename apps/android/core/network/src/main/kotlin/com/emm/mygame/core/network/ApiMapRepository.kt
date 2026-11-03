package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.FiefListFiefsInner
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

    override suspend fun readOwn(fief: FiefId): MapReadResult =
        readOf { api.fiefsFiefIdMapGet(UUID.fromString(fief.value)) }

    override suspend fun read(fief: FiefId, province: Int): MapReadResult =
        readOf { api.fiefsFiefIdMapProvinceGet(UUID.fromString(fief.value), province.toString()) }

    private suspend fun readOf(request: suspend () -> Response<ProvinceMapBody>): MapReadResult =
        withContext(ioDispatcher) {
            try {
                val lordsFiefs: List<FiefListFiefsInner> = api.fiefsGet().body()?.fiefs.orEmpty()
                request().toMapReadResult(lordsFiefs)
            } catch (expectedOutage: IOException) {
                MapReadResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                MapReadResult.Unreachable
            }
        }

    private fun Response<ProvinceMapBody>.toMapReadResult(lordsFiefs: List<FiefListFiefsInner>): MapReadResult {
        if (isSuccessful) {
            val map: ProvinceMap = body()?.toProvinceMap(lordsFiefs) ?: return MapReadResult.Unreachable
            return MapReadResult.Read(map)
        }
        return when (apiError()?.kind) {
            ApiError.Kind.ProvinceNotFound -> MapReadResult.ProvinceNotFound
            else -> MapReadResult.Unreachable
        }
    }
}
