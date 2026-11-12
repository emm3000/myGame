package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.CleanUpJob
import com.emm.mygame.core.network.generated.models.Job
import com.emm.mygame.core.network.generated.models.JobPhase
import com.emm.mygame.core.network.generated.models.JobQuote
import com.emm.mygame.core.network.generated.models.NotEnoughHiresAtHomeErrorParams
import com.emm.mygame.core.network.generated.models.ResourceAmounts
import com.emm.mygame.core.network.generated.models.SendJob
import com.emm.mygame.core.network.generated.models.SendJobSite
import com.emm.mygame.core.network.generated.models.Team
import com.emm.mygame.core.network.generated.models.TownJob
import com.emm.mygame.core.network.generated.models.TownOverview
import retrofit2.Response

internal fun TownJob.toJob(): TownSnapshot.Job? = when (this) {
    is TownJob.JobWrapper -> value.toJob()
    is TownJob.CleanupWrapper -> value.toJob()
}

private fun Job.toJob(): TownSnapshot.Job? {
    val jobPhase: TownSnapshot.JobPhase = phase.toJobPhase() ?: return null
    return TownSnapshot.Job(
        site = site.toTownSite(),
        team = team.toHires(),
        hours = hours,
        pay = pay.toPay(),
        phase = jobPhase,
        sentAt = sentAt.toKotlinInstant(),
        arrivesAt = arrivesAt.toKotlinInstant(),
        leavesAt = leavesAt.toKotlinInstant(),
        returnsAt = returnsAt.toKotlinInstant(),
        calledBackAt = calledBackAt?.toKotlinInstant(),
    )
}

private fun CleanUpJob.toJob(): TownSnapshot.Job? {
    val jobPhase: TownSnapshot.JobPhase = phase.toJobPhase() ?: return null
    return TownSnapshot.Job(
        site = site.toTownSite(),
        team = team.toHires(),
        hours = 0,
        pay = pay.toPay(),
        phase = jobPhase,
        sentAt = sentAt.toKotlinInstant(),
        arrivesAt = arrivesAt.toKotlinInstant(),
        leavesAt = leavesAt.toKotlinInstant(),
        returnsAt = returnsAt.toKotlinInstant(),
        calledBackAt = calledBackAt?.toKotlinInstant(),
    )
}

private fun Team.toHires(): Map<TownHireKind, Int> = mapOf(TownHireKind.Worker to worker, TownHireKind.Truck to truck)

private fun ResourceAmounts.toPay(): Map<TownResourceKind, Long> = mapOf(
    TownResourceKind.Money to money.toLong(),
    TownResourceKind.Food to food.toLong(),
    TownResourceKind.Power to power.toLong(),
    TownResourceKind.Material to material.toLong(),
)

internal fun sendJobOf(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): SendJob = SendJob(
    site = SendJobSite(area = target.area, site = target.site),
    team = Team(
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

internal fun quoteResultOf(response: Response<JobQuote>): JobQuoteResult {
    val quote: JobQuote? = response.body()
    if (response.isSuccessful) {
        return if (quote == null) JobQuoteResult.Unreachable else JobQuoteResult.Quoted(quote.pay.toPay())
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return JobQuoteResult.Unreachable
    return JobQuoteResult.Refused(refusal.toJobRefusal())
}

private fun JobPhase.toJobPhase(): TownSnapshot.JobPhase? = when (this) {
    JobPhase.outbound -> TownSnapshot.JobPhase.Outbound
    JobPhase.working -> TownSnapshot.JobPhase.Working
    JobPhase.returning -> TownSnapshot.JobPhase.Returning
    JobPhase.unknown_default_open_api -> null
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
