package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.BarracksTooLowErrorParams
import com.emm.mygame.core.network.generated.models.NotEnoughUnitsAtHomeErrorParams
import com.emm.mygame.core.network.generated.models.DispatchAttackRequest
import com.emm.mygame.core.network.generated.models.DispatchFoundingRequest
import com.emm.mygame.core.network.generated.models.DispatchMarchRequest
import com.emm.mygame.core.network.generated.models.DispatchTransportRequest
import com.emm.mygame.core.network.generated.models.EnqueueBuildingRequest
import com.emm.mygame.core.network.generated.models.FiefOverview
import com.emm.mygame.core.network.generated.models.PlaceRecruitOrderRequest
import com.emm.mygame.core.network.generated.models.StartStudyRequest
import java.io.IOException
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID
import kotlin.time.Instant
import kotlin.time.toJavaInstant
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal class ApiFiefRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : FiefRepository {

    override suspend fun read(fief: FiefId): FiefReadResult = withContext(ioDispatcher) {
        try {
            val overview: FiefOverview? = api.fiefsFiefIdGet(UUID.fromString(fief.value)).body()
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
            api.fiefsFiefIdStudiesPost(UUID.fromString(fief.value), request).toStudyResult()
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
                response.toStudyResult()
            } catch (expectedOutage: IOException) {
                StudyResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                StudyResult.Unreachable
            }
        }

    override suspend fun recruit(fief: FiefId, unit: UnitKind, count: Int): RecruitResult =
        withContext(ioDispatcher) {
            try {
                val request = PlaceRecruitOrderRequest(unit = unit.toWireUnit(), count = count)
                recruitedOrRefused(api.fiefsFiefIdRecruitOrdersPost(UUID.fromString(fief.value), request))
            } catch (expectedOutage: IOException) {
                RecruitResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                RecruitResult.Unreachable
            }
        }

    override suspend fun cancelRecruit(fief: FiefId, unit: UnitKind, startedAt: Instant): RecruitResult =
        withContext(ioDispatcher) {
            try {
                val response: Response<FiefOverview> = api.fiefsFiefIdRecruitOrdersUnitStartedAtDelete(
                    fiefId = UUID.fromString(fief.value),
                    unit = unit.toWireUnit().value,
                    startedAt = OffsetDateTime.ofInstant(startedAt.toJavaInstant(), ZoneOffset.UTC),
                )
                recruitedOrRefused(response)
            } catch (expectedOutage: IOException) {
                RecruitResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                RecruitResult.Unreachable
            }
        }

    override suspend fun dispatch(fief: FiefId, march: MarchDispatch): MarchResult = marching {
        val id: UUID = UUID.fromString(fief.value)
        when (march) {
            is MarchDispatch.Forage -> api.fiefsFiefIdMarchesPost(id, march.toRequest())
            is MarchDispatch.Attack -> api.fiefsFiefIdMarchesAttackPost(id, march.toRequest())
            is MarchDispatch.Found -> api.fiefsFiefIdMarchesFoundPost(id, march.toRequest())
            is MarchDispatch.Transport -> api.fiefsFiefIdMarchesTransportPost(id, march.toRequest())
        }
    }

    private suspend fun marching(call: suspend () -> Response<FiefOverview>): MarchResult =
        withContext(ioDispatcher) {
            try {
                marchedOrRefused(call())
            } catch (expectedOutage: IOException) {
                MarchResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                MarchResult.Unreachable
            }
        }

    override suspend fun recall(fief: FiefId, departedAt: Instant): MarchResult = withContext(ioDispatcher) {
        try {
            val response: Response<FiefOverview> = api.fiefsFiefIdMarchesDepartedAtRecallPost(
                fiefId = UUID.fromString(fief.value),
                departedAt = OffsetDateTime.ofInstant(departedAt.toJavaInstant(), ZoneOffset.UTC),
            )
            marchedOrRefused(response)
        } catch (expectedOutage: IOException) {
            MarchResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            MarchResult.Unreachable
        }
    }

    private fun marchedOrRefused(response: Response<FiefOverview>): MarchResult {
        val snapshot: FiefSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) MarchResult.Unreachable else MarchResult.Answered(snapshot)
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return MarchResult.Unreachable
        return MarchResult.Refused(refusal.toMarchRefusal())
    }

    private fun recruitedOrRefused(response: Response<FiefOverview>): RecruitResult {
        val snapshot: FiefSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) RecruitResult.Unreachable else RecruitResult.Answered(snapshot)
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return RecruitResult.Unreachable
        return RecruitResult.Refused(refusal.toRecruitRefusal())
    }

    private fun cancelledOrRefused(response: Response<FiefOverview>): CancelResult {
        val snapshot: FiefSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) CancelResult.Unreachable else CancelResult.Cancelled(snapshot)
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return CancelResult.Unreachable
        return CancelResult.Refused(refusal.toCancelRefusal())
    }

    private fun upgradedOrRefused(response: Response<FiefOverview>): UpgradeResult {
        val snapshot: FiefSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) UpgradeResult.Unreachable else UpgradeResult.Upgraded(snapshot)
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return UpgradeResult.Unreachable
        return UpgradeResult.Refused(refusal.toUpgradeRefusal())
    }
}

internal fun Response<FiefOverview>.toStudyResult(): StudyResult {
    val snapshot: FiefSnapshot? = body()?.toSnapshot()
    if (isSuccessful) return if (snapshot == null) StudyResult.Unreachable else StudyResult.Answered(snapshot)
    val refusal: WireRefusal = wireRefusal() ?: return StudyResult.Unreachable
    return StudyResult.Refused(refusal.toStudyRefusal())
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

private val studyRefusals: Map<BareApiError.Kind, StudyRefusal> = mapOf(
    BareApiError.Kind.StudySlotBusy to StudyRefusal.StudySlotBusy,
    BareApiError.Kind.LibraryLevelTooLow to StudyRefusal.LibraryLevelTooLow,
    BareApiError.Kind.ArtMaxLevelReached to StudyRefusal.ArtMaxLevelReached,
    BareApiError.Kind.StudyNotFound to StudyRefusal.StudyNotFound,
    BareApiError.Kind.InsufficientResources to StudyRefusal.InsufficientResources,
)

private fun WireRefusal.toStudyRefusal(): StudyRefusal =
    bareKind()?.let(studyRefusals::get) ?: StudyRefusal.Unrecognized

private val recruitRefusals: Map<BareApiError.Kind, RecruitRefusal> = mapOf(
    BareApiError.Kind.BarracksNotBuilt to RecruitRefusal.BarracksNotBuilt,
    BareApiError.Kind.RecruitSlotBusy to RecruitRefusal.RecruitSlotBusy,
    BareApiError.Kind.RecruitOrderNotFound to RecruitRefusal.RecruitOrderNotFound,
    BareApiError.Kind.InsufficientResources to RecruitRefusal.InsufficientResources,
    BareApiError.Kind.NotEnoughPeasants to RecruitRefusal.NotEnoughPeasants,
)

private val marchRefusals: Map<BareApiError.Kind, MarchRefusal> = mapOf(
    BareApiError.Kind.MarchSlotBusy to MarchRefusal.MarchSlotBusy,
    BareApiError.Kind.MarchTargetOutOfBounds to MarchRefusal.MarchTargetOutOfBounds,
    BareApiError.Kind.PlotHeld to MarchRefusal.PlotHeld,
    BareApiError.Kind.PlotHasCamp to MarchRefusal.PlotHasCamp,
    BareApiError.Kind.PlotHasNoCamp to MarchRefusal.PlotHasNoCamp,
    BareApiError.Kind.PlotReserved to MarchRefusal.PlotReserved,
    BareApiError.Kind.MarchToOwnPlot to MarchRefusal.MarchToOwnPlot,
    BareApiError.Kind.UnitUnfitForOrder to MarchRefusal.UnitUnfitForOrder,
    BareApiError.Kind.BlankFiefName to MarchRefusal.BlankFiefName,
    BareApiError.Kind.EmptyCargo to MarchRefusal.EmptyCargo,
    BareApiError.Kind.InsufficientResources to MarchRefusal.InsufficientResources,
    BareApiError.Kind.FiefNotFound to MarchRefusal.FiefNotFound,
    BareApiError.Kind.MarchNotFound to MarchRefusal.MarchNotFound,
    BareApiError.Kind.MarchAlreadyReturning to MarchRefusal.MarchAlreadyReturning,
)

private fun WireRefusal.toMarchRefusal(): MarchRefusal = when (this) {
    is WireRefusal.Bare -> marchRefusals[kind] ?: MarchRefusal.Unrecognized
    is WireRefusal.WithParams -> error.toMarchRefusal()
}

private fun ApiError.toMarchRefusal(): MarchRefusal = when (this) {
    is ApiError.NotenoughunitsathomeWrapper -> value.params.toUnitsShortAtHome()
    is ApiError.StayoutofrangeWrapper -> MarchRefusal.StayOutOfRange(value.params.maxStayHours)
    is ApiError.FiefcapreachedWrapper -> MarchRefusal.FiefCapReached(value.params.cap)
    is ApiError.CargoabovecarryWrapper -> MarchRefusal.CargoAboveCarry(value.params.cargo, value.params.carry)
    else -> MarchRefusal.Unrecognized
}

private fun NotEnoughUnitsAtHomeErrorParams.toUnitsShortAtHome(): MarchRefusal {
    val kind: UnitKind = unitOf(unit.value) ?: return MarchRefusal.Unrecognized
    return MarchRefusal.NotEnoughUnitsAtHome(unit = kind, count = count, atHome = atHome)
}

private fun WireRefusal.toRecruitRefusal(): RecruitRefusal = when (this) {
    is WireRefusal.Bare -> recruitRefusals[kind] ?: RecruitRefusal.Unrecognized
    is WireRefusal.WithParams ->
        (error as? ApiError.BarrackstoolowWrapper)?.value?.params?.toBarracksTooLow() ?: RecruitRefusal.Unrecognized
}

private fun BarracksTooLowErrorParams.toBarracksTooLow(): RecruitRefusal? =
    unitOf(unit.value)?.let { kind: UnitKind -> RecruitRefusal.BarracksTooLow(kind, requiredBarracksLevel) }

private val upgradeRefusals: Map<BareApiError.Kind, UpgradeRefusal> = mapOf(
    BareApiError.Kind.QueueFull to UpgradeRefusal.QueueFull,
    BareApiError.Kind.InsufficientResources to UpgradeRefusal.InsufficientResources,
    BareApiError.Kind.NotEnoughPeasants to UpgradeRefusal.NotEnoughPeasants,
    BareApiError.Kind.MaxLevelReached to UpgradeRefusal.MaxLevelReached,
)

private fun WireRefusal.toUpgradeRefusal(): UpgradeRefusal =
    bareKind()?.let(upgradeRefusals::get) ?: UpgradeRefusal.Unrecognized

private fun WireRefusal.toCancelRefusal(): CancelRefusal =
    if (bareKind() == BareApiError.Kind.UpgradeNotFound) CancelRefusal.UpgradeNotFound else CancelRefusal.Unrecognized

private fun MarchDispatch.Forage.toRequest(): DispatchMarchRequest = DispatchMarchRequest(
    province = target.province,
    plot = target.plot,
    units = party.toWireUnits(),
    stayHours = stayHours,
)

private fun MarchDispatch.Attack.toRequest(): DispatchAttackRequest =
    DispatchAttackRequest(province = target.province, plot = target.plot, units = party.toWireUnits())

private fun MarchDispatch.Found.toRequest(): DispatchFoundingRequest =
    DispatchFoundingRequest(province = target.province, plot = target.plot, name = name)

private fun MarchDispatch.Transport.toRequest(): DispatchTransportRequest = DispatchTransportRequest(
    toFiefId = UUID.fromString(destination.value),
    units = party.toWireUnits(),
    cargo = cargo.toWireCargo(),
)
