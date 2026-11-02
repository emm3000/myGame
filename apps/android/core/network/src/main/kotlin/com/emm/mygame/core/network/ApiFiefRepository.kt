package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.EnqueueBuildingRequest
import com.emm.mygame.core.network.generated.models.FiefOverview
import java.io.IOException
import java.util.UUID
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

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

    override suspend fun upgrade(fief: FiefId, building: BuildingKind): UpgradeResult = withContext(ioDispatcher) {
        try {
            val request = EnqueueBuildingRequest(building = building.toWireBuilding())
            upgradedOrRefused(api.fiefsFiefIdUpgradesPost(UUID.fromString(fief.value), request))
        } catch (expectedOutage: IOException) {
            UpgradeResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            UpgradeResult.Unreachable
        }
    }

    private fun upgradedOrRefused(response: Response<FiefOverview>): UpgradeResult {
        val snapshot: FiefSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) UpgradeResult.Unreachable else UpgradeResult.Upgraded(snapshot)
        }
        val refusal: ApiError = response.apiError() ?: return UpgradeResult.Unreachable
        return UpgradeResult.Refused(refusal.kind.toUpgradeRefusal())
    }
}

private fun BuildingKind.toWireBuilding(): EnqueueBuildingRequest.Building = when (this) {
    BuildingKind.Sawmill -> EnqueueBuildingRequest.Building.sawmill
    BuildingKind.Quarry -> EnqueueBuildingRequest.Building.quarry
    BuildingKind.IronMine -> EnqueueBuildingRequest.Building.ironMine
    BuildingKind.Farm -> EnqueueBuildingRequest.Building.farm
    BuildingKind.Warehouse -> EnqueueBuildingRequest.Building.warehouse
    BuildingKind.Library -> EnqueueBuildingRequest.Building.library
    BuildingKind.Barracks -> EnqueueBuildingRequest.Building.barracks
}

private val upgradeRefusals: Map<ApiError.Kind, UpgradeRefusal> = mapOf(
    ApiError.Kind.QueueFull to UpgradeRefusal.QueueFull,
    ApiError.Kind.InsufficientResources to UpgradeRefusal.InsufficientResources,
    ApiError.Kind.NotEnoughPeasants to UpgradeRefusal.NotEnoughPeasants,
    ApiError.Kind.MaxLevelReached to UpgradeRefusal.MaxLevelReached,
)

private fun ApiError.Kind.toUpgradeRefusal(): UpgradeRefusal = upgradeRefusals[this] ?: UpgradeRefusal.Unrecognized
