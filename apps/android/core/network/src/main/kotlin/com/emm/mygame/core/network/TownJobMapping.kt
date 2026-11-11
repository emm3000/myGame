package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.NotEnoughHiresAtHomeErrorParams
import com.emm.mygame.core.network.generated.models.SendJob
import com.emm.mygame.core.network.generated.models.SendJobSite
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.generated.models.TownOverviewJob
import com.emm.mygame.core.network.generated.models.TownOverviewJobTeam
import retrofit2.Response

internal fun TownOverviewJob.toJob(): TownSnapshot.Job? {
    val jobPhase: TownSnapshot.JobPhase = phase.toJobPhase() ?: return null
    return TownSnapshot.Job(
        site = site.toTownSite(),
        team = mapOf(TownHireKind.Worker to team.worker, TownHireKind.Truck to team.truck),
        hours = hours,
        pay = mapOf(
            TownResourceKind.Money to pay.money.toLong(),
            TownResourceKind.Food to pay.food.toLong(),
            TownResourceKind.Power to pay.power.toLong(),
            TownResourceKind.Material to pay.material.toLong(),
        ),
        phase = jobPhase,
        sentAt = sentAt.toKotlinInstant(),
        arrivesAt = arrivesAt.toKotlinInstant(),
        leavesAt = leavesAt.toKotlinInstant(),
        returnsAt = returnsAt.toKotlinInstant(),
        calledBackAt = calledBackAt?.toKotlinInstant(),
    )
}

internal fun sendJobOf(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): SendJob = SendJob(
    site = SendJobSite(area = target.area, site = target.site),
    team = TownOverviewJobTeam(
        worker = team.getOrDefault(TownHireKind.Worker, 0),
        truck = team.getOrDefault(TownHireKind.Truck, 0),
    ),
    hours = hours,
)

internal fun jobResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownJobResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownJobResult.Unreachable else TownJobResult.Answered(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownJobResult.Unreachable
    return TownJobResult.Refused(refusal.toJobRefusal())
}

private fun TownOverviewJob.Phase.toJobPhase(): TownSnapshot.JobPhase? = when (this) {
    TownOverviewJob.Phase.outbound -> TownSnapshot.JobPhase.Outbound
    TownOverviewJob.Phase.working -> TownSnapshot.JobPhase.Working
    TownOverviewJob.Phase.returning -> TownSnapshot.JobPhase.Returning
    TownOverviewJob.Phase.unknown_default_open_api -> null
}

private val jobRefusals: Map<BareApiError.Kind, TownJobRefusal> = mapOf(
    BareApiError.Kind.InvalidTeam to TownJobRefusal.InvalidTeam,
    BareApiError.Kind.JobSiteOutOfBounds to TownJobRefusal.JobSiteOutOfBounds,
    BareApiError.Kind.TeamAlreadyOut to TownJobRefusal.TeamAlreadyOut,
    BareApiError.Kind.JobToOwnSite to TownJobRefusal.JobToOwnSite,
    BareApiError.Kind.SiteHeld to TownJobRefusal.SiteHeld,
    BareApiError.Kind.JobNotFound to TownJobRefusal.JobNotFound,
    BareApiError.Kind.JobAlreadyReturning to TownJobRefusal.JobAlreadyReturning,
    BareApiError.Kind.TownNotFound to TownJobRefusal.TownNotFound,
)

private fun WireRefusal.toJobRefusal(): TownJobRefusal = when (this) {
    is WireRefusal.Bare -> jobRefusals[kind] ?: TownJobRefusal.Unrecognized
    is WireRefusal.WithParams -> error.toJobRefusal()
}

private fun ApiError.toJobRefusal(): TownJobRefusal = when (this) {
    is ApiError.JobhoursoutofrangeWrapper ->
        TownJobRefusal.JobHoursOutOfRange(hours = value.params.hours, maxHours = value.params.maxHours)
    is ApiError.NotenoughhiresathomeWrapper -> value.params.toNotEnoughHiresAtHome()
    else -> TownJobRefusal.Unrecognized
}

private fun NotEnoughHiresAtHomeErrorParams.toNotEnoughHiresAtHome(): TownJobRefusal {
    val kind: TownHireKind = hire.toTownHireKind() ?: return TownJobRefusal.Unrecognized
    return TownJobRefusal.NotEnoughHiresAtHome(hire = kind, count = count, atHome = atHome)
}

private fun NotEnoughHiresAtHomeErrorParams.Hire.toTownHireKind(): TownHireKind? = when (this) {
    NotEnoughHiresAtHomeErrorParams.Hire.worker -> TownHireKind.Worker
    NotEnoughHiresAtHomeErrorParams.Hire.truck -> TownHireKind.Truck
    NotEnoughHiresAtHomeErrorParams.Hire.unknown_default_open_api -> null
}
