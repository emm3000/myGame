package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.EnqueueBuildingRequest
import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.StartStudyRequest
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

    override suspend fun cancel(fief: FiefId, building: BuildingKind, targetLevel: Int): CancelResult =
        withContext(ioDispatcher) {
            try {
                val response: Response<FiefOverview> = api.fiefsFiefIdUpgradesBuildingTargetLevelDelete(
                    fiefId = UUID.fromString(fief.value),
                    building = building.toWireBuilding().value,
                    targetLevel = targetLevel.toString(),
                )
                cancelledOrRefused(response)
            } catch (expectedOutage: IOException) {
                CancelResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                CancelResult.Unreachable
            }
        }

    override suspend fun startStudy(fief: FiefId, art: ArtKind): StudyResult = withContext(ioDispatcher) {
        try {
            val request = StartStudyRequest(art = art.toWireArt())
            studiedOrRefused(api.fiefsFiefIdStudiesPost(UUID.fromString(fief.value), request))
        } catch (expectedOutage: IOException) {
            StudyResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            StudyResult.Unreachable
        }
    }

    override suspend fun cancelStudy(fief: FiefId, art: ArtKind, targetLevel: Int): StudyResult =
        withContext(ioDispatcher) {
            try {
                val response: Response<FiefOverview> = api.fiefsFiefIdStudiesArtTargetLevelDelete(
                    fiefId = UUID.fromString(fief.value),
                    art = art.toWireArt().value,
                    targetLevel = targetLevel.toString(),
                )
                studiedOrRefused(response)
            } catch (expectedOutage: IOException) {
                StudyResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                StudyResult.Unreachable
            }
        }

    private fun studiedOrRefused(response: Response<FiefOverview>): StudyResult {
        val snapshot: FiefSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) StudyResult.Unreachable else StudyResult.Answered(snapshot)
        }
        val refusal: ApiError = response.apiError() ?: return StudyResult.Unreachable
        return StudyResult.Refused(refusal.kind.toStudyRefusal())
    }

    private fun cancelledOrRefused(response: Response<FiefOverview>): CancelResult {
        val snapshot: FiefSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) CancelResult.Unreachable else CancelResult.Cancelled(snapshot)
        }
        val refusal: ApiError = response.apiError() ?: return CancelResult.Unreachable
        return CancelResult.Refused(refusal.kind.toCancelRefusal())
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

private fun ArtKind.toWireArt(): StartStudyRequest.Art = when (this) {
    ArtKind.Smithing -> StartStudyRequest.Art.smithing
    ArtKind.Masonry -> StartStudyRequest.Art.masonry
}

private val studyRefusals: Map<ApiError.Kind, StudyRefusal> = mapOf(
    ApiError.Kind.StudySlotBusy to StudyRefusal.StudySlotBusy,
    ApiError.Kind.LibraryLevelTooLow to StudyRefusal.LibraryLevelTooLow,
    ApiError.Kind.ArtMaxLevelReached to StudyRefusal.ArtMaxLevelReached,
    ApiError.Kind.StudyNotFound to StudyRefusal.StudyNotFound,
    ApiError.Kind.InsufficientResources to StudyRefusal.InsufficientResources,
)

private fun ApiError.Kind.toStudyRefusal(): StudyRefusal = studyRefusals[this] ?: StudyRefusal.Unrecognized

private val upgradeRefusals: Map<ApiError.Kind, UpgradeRefusal> = mapOf(
    ApiError.Kind.QueueFull to UpgradeRefusal.QueueFull,
    ApiError.Kind.InsufficientResources to UpgradeRefusal.InsufficientResources,
    ApiError.Kind.NotEnoughPeasants to UpgradeRefusal.NotEnoughPeasants,
    ApiError.Kind.MaxLevelReached to UpgradeRefusal.MaxLevelReached,
)

private fun ApiError.Kind.toUpgradeRefusal(): UpgradeRefusal = upgradeRefusals[this] ?: UpgradeRefusal.Unrecognized

private fun ApiError.Kind.toCancelRefusal(): CancelRefusal =
    if (this == ApiError.Kind.UpgradeNotFound) CancelRefusal.UpgradeNotFound else CancelRefusal.Unrecognized
