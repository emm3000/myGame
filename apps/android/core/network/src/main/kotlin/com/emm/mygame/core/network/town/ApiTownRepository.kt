package com.emm.mygame.core.network.town

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownFoundResult
import com.emm.mygame.core.model.town.TownReadResult
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.building.TownWorkResult
import com.emm.mygame.core.model.town.gapOf
import com.emm.mygame.core.model.town.guidance.TownGuidanceRepository
import com.emm.mygame.core.model.town.hiring.TownHireKind
import com.emm.mygame.core.model.town.hiring.TownHiringResult
import com.emm.mygame.core.model.town.jobs.JobTarget
import com.emm.mygame.core.model.town.jobs.RegionReader
import com.emm.mygame.core.model.town.jobs.TownJobResult
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.FoundTown
import com.emm.mygame.core.network.generated.models.PlaceHiringOrder
import com.emm.mygame.core.network.generated.models.StartBuildingWork
import com.emm.mygame.core.network.generated.models.StartLessonRequest
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.platform.bareKind
import com.emm.mygame.core.network.platform.toOffsetDateTime
import com.emm.mygame.core.network.platform.wireRefusal
import com.emm.mygame.core.network.town.building.toWireBuilding
import com.emm.mygame.core.network.town.building.workResultOf
import com.emm.mygame.core.network.town.hiring.hiringResultOf
import com.emm.mygame.core.network.town.hiring.toWireHire
import com.emm.mygame.core.network.town.jobs.jobResultOf
import com.emm.mygame.core.network.town.jobs.sendCleanUpOf
import com.emm.mygame.core.network.town.jobs.sendJobOf
import com.emm.mygame.core.network.town.school.lessonResultOf
import java.io.IOException
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import retrofit2.Response

internal class ApiTownRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
    private val clock: Clock,
    private val answers: TownAnswers,
    private val reads: TownReadFlight,
    regionReader: RegionReader,
    guidance: TownGuidanceRepository,
) : TownRepository,
    RegionReader by regionReader,
    TownGuidanceRepository by guidance {

    private val _town: MutableStateFlow<HeldTown?> = MutableStateFlow(null)

    override val town: StateFlow<HeldTown?> = _town.asStateFlow()

    private val holding: Any = Any()

    private var lastHeldSend: Long = 0L

    init {
        answers.onSessionChange(::forget)
    }

    override suspend fun read(): TownReadResult = reads.read(::sentRead)

    override suspend fun readSentAfterNow(): TownReadResult = reads.readSentNow(::sentRead)

    override suspend fun found(name: String): TownFoundResult =
        answering(TownFoundResult.Unreachable, ::foundResultOf) { api.townPost(FoundTown(name = name)) }

    override suspend fun startWork(building: TownBuildingKind): TownWorkResult =
        answering(TownWorkResult.Unreachable, ::workResultOf) {
            api.townWorkPost(StartBuildingWork(building = building.toWireBuilding()))
        }

    override suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult =
        answering(TownWorkResult.Unreachable, ::workResultOf) {
            api.townWorkBuildingLevelDelete(building = building.toWireBuilding().value, level = level.toString())
        }

    override suspend fun startLesson(lesson: LessonId): TownLessonResult =
        answering(TownLessonResult.Unreachable, ::lessonResultOf) {
            api.townLessonsPost(StartLessonRequest(lessonId = lesson.value))
        }

    override suspend fun stopLesson(lesson: LessonId): TownLessonResult =
        answering(TownLessonResult.Unreachable, ::lessonResultOf) {
            api.townLessonsLessonIdDelete(lessonId = lesson.value)
        }

    override suspend fun placeHiring(hire: TownHireKind, count: Int): TownHiringResult =
        answering(TownHiringResult.Unreachable, ::hiringResultOf) {
            api.townHiringPost(PlaceHiringOrder(hire = hire.toWireHire(), count = count))
        }

    override suspend fun stopHiring(hire: TownHireKind, startedAt: Instant): TownHiringResult =
        answering(TownHiringResult.Unreachable, ::hiringResultOf) {
            api.townHiringHireStartedAtDelete(hire = hire.toWireHire().value, startedAt = startedAt.toOffsetDateTime())
        }

    override suspend fun sendJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): TownJobResult =
        answering(TownJobResult.Unreachable, ::jobResultOf) { api.townJobsPost(sendJobOf(target, team, hours)) }

    override suspend fun sendCleanUp(target: JobTarget, team: Map<TownHireKind, Int>): TownJobResult =
        answering(TownJobResult.Unreachable, ::jobResultOf) { api.townCleanUpsPost(sendCleanUpOf(target, team)) }

    override suspend fun callJobBack(sentAt: Instant): TownJobResult =
        answering(TownJobResult.Unreachable, ::jobResultOf) {
            api.townJobsSentAtCallBackPost(sentAt = sentAt.toOffsetDateTime())
        }

    private suspend fun <Answer> answering(
        unreachable: Answer,
        resultOf: (Response<TownOverview>, TownSnapshot?) -> Answer,
        call: suspend () -> Response<TownOverview>,
    ): Answer = withContext(ioDispatcher) {
        try {
            val request: TownRequest = answers.sending()
            val response: Response<TownOverview> = call()
            answers.languageAnswered(request, response)
            resultOf(response, answeredTown(response, request))
        } catch (expectedOutage: IOException) {
            unreachable
        } catch (expectedMalformedBody: IllegalArgumentException) {
            unreachable
        }
    }

    private suspend fun sentRead(request: TownRequest): TownReadResult =
        try {
            val response: Response<TownOverview> = api.townGet()
            answers.languageAnswered(request, response)
            readOrNoTown(response, request)
        } catch (expectedOutage: IOException) {
            TownReadResult.Unreachable
        } catch (expectedMalformedBody: IllegalArgumentException) {
            TownReadResult.Unreachable
        }

    private fun readTown(response: Response<TownOverview>, request: TownRequest): TownSnapshot? =
        response.body()?.toSnapshot()?.also { town: TownSnapshot ->
            hold(request) { HeldTown(town, gap = gapOf(town.readAt, clock)) }
            answers.townAnswered(request, town)
        }

    private fun answeredTown(response: Response<TownOverview>, request: TownRequest): TownSnapshot? =
        response.body()?.toSnapshot()?.also { town: TownSnapshot ->
            hold(request) { last: HeldTown? -> HeldTown(town, gap = last?.gap ?: gapOf(town.readAt, clock)) }
            answers.townAnswered(request, town)
        }

    private fun hold(request: TownRequest, next: (HeldTown?) -> HeldTown?) {
        synchronized(holding) {
            if (!answers.isCurrent(request) || request.study.wasSentBefore(lastHeldSend)) return
            lastHeldSend = request.study.order
            _town.value = next(_town.value)
        }
    }

    private fun forget() {
        synchronized(holding) {
            _town.value = null
        }
    }

    private fun readOrNoTown(response: Response<TownOverview>, request: TownRequest): TownReadResult {
        val snapshot: TownSnapshot? = readTown(response, request)
        if (response.isSuccessful) {
            return if (snapshot == null) TownReadResult.Unreachable else TownReadResult.Read(snapshot)
        }
        val isNoTown: Boolean = response.wireRefusal()?.bareKind() == BareApiError.Kind.TownNotFound
        if (!isNoTown) return TownReadResult.Unreachable
        hold(request) { null }
        return TownReadResult.NoTown
    }
}
