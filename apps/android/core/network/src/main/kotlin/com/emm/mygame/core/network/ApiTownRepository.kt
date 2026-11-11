package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.FoundTown
import com.emm.mygame.core.network.generated.models.PlaceHiringOrder
import com.emm.mygame.core.network.generated.models.StartBuildingWork
import com.emm.mygame.core.network.generated.models.StartLessonRequest
import com.emm.mygame.core.network.generated.models.TownOverview
import java.io.IOException
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal class ApiTownRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
    private val clock: Clock,
    private val tokenStore: TokenStore,
) : TownRepository {

    private val _town: MutableStateFlow<HeldTown?> = MutableStateFlow(null)

    override val town: StateFlow<HeldTown?> = _town.asStateFlow()

    private val holding: Any = Any()

    init {
        tokenStore.onSessionChange(::forget)
    }

    override suspend fun read(): TownReadResult = withContext(ioDispatcher) {
        try {
            val session: Int = tokenStore.currentSession()
            readOrNoTown(api.townGet(), session)
        } catch (expectedOutage: IOException) {
            TownReadResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            TownReadResult.Unreachable
        }
    }

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

    override suspend fun readMap(area: Int?): RegionMapResult = withContext(ioDispatcher) {
        try {
            regionMapResultOf(if (area == null) api.townMapGet() else api.townMapAreaGet(area = area.toString()))
        } catch (expectedOutage: IOException) {
            RegionMapResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            RegionMapResult.Unreachable
        }
    }

    override suspend fun sendJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): TownJobResult =
        answering(TownJobResult.Unreachable, ::jobResultOf) { api.townJobsPost(sendJobOf(target, team, hours)) }

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
            val session: Int = tokenStore.currentSession()
            val response: Response<TownOverview> = call()
            resultOf(response, answeredTown(response, session))
        } catch (expectedOutage: IOException) {
            unreachable
        } catch (expectedMalformedBody: SerializationException) {
            unreachable
        }
    }

    private fun readTown(response: Response<TownOverview>, session: Int): TownSnapshot? =
        response.body()?.toSnapshot()?.also { town: TownSnapshot ->
            hold(session) { HeldTown(town, gap = town.readAt - clock.now()) }
        }

    private fun answeredTown(response: Response<TownOverview>, session: Int): TownSnapshot? =
        response.body()?.toSnapshot()?.also { town: TownSnapshot ->
            hold(session) { last: HeldTown? -> HeldTown(town, gap = last?.gap ?: (town.readAt - clock.now())) }
        }

    private fun hold(session: Int, next: (HeldTown?) -> HeldTown?) {
        synchronized(holding) {
            if (tokenStore.currentSession() != session) return
            _town.value = next(_town.value)
        }
    }

    private fun forget() {
        synchronized(holding) {
            _town.value = null
        }
    }

    private fun readOrNoTown(response: Response<TownOverview>, session: Int): TownReadResult {
        val snapshot: TownSnapshot? = readTown(response, session)
        if (response.isSuccessful) {
            return if (snapshot == null) TownReadResult.Unreachable else TownReadResult.Read(snapshot)
        }
        val isNoTown: Boolean = response.wireRefusal()?.bareKind() == BareApiError.Kind.TownNotFound
        if (!isNoTown) return TownReadResult.Unreachable
        hold(session) { null }
        return TownReadResult.NoTown
    }
}

private fun foundResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownFoundResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownFoundResult.Unreachable else TownFoundResult.Founded(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownFoundResult.Unreachable
    return TownFoundResult.Refused(refusal.toFoundRefusal())
}

private fun workResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownWorkResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownWorkResult.Unreachable else TownWorkResult.Answered(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownWorkResult.Unreachable
    return TownWorkResult.Refused(refusal.toWorkRefusal())
}

private fun lessonResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownLessonResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownLessonResult.Unreachable else TownLessonResult.Answered(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownLessonResult.Unreachable
    return TownLessonResult.Refused(refusal.toLessonRefusal())
}

private fun hiringResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownHiringResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownHiringResult.Unreachable else TownHiringResult.Answered(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownHiringResult.Unreachable
    return TownHiringResult.Refused(refusal.toHiringRefusal())
}

private fun WireRefusal.toFoundRefusal(): TownFoundRefusal = when (bareKind()) {
    BareApiError.Kind.BlankTownName -> TownFoundRefusal.BlankTownName
    BareApiError.Kind.PlayerAlreadyHoldsTown -> TownFoundRefusal.PlayerAlreadyHoldsTown
    else -> TownFoundRefusal.Unrecognized
}

private fun WireRefusal.toWorkRefusal(): TownWorkRefusal = when (this) {
    is WireRefusal.Bare ->
        if (kind == BareApiError.Kind.TownNotFound) TownWorkRefusal.TownNotFound else TownWorkRefusal.Unrecognized
    is WireRefusal.WithParams -> error.toWorkRefusal()
}

private fun ApiError.toWorkRefusal(): TownWorkRefusal = when (this) {
    is ApiError.WaitinglistfullWrapper -> TownWorkRefusal.WaitingListFull(value.params.cap)
    is ApiError.ToplevelreachedWrapper -> TownWorkRefusal.TopLevelReached(value.params.level)
    is ApiError.NotenoughpeopleWrapper ->
        TownWorkRefusal.NotEnoughPeople(required = value.params.requiredPeople, free = value.params.freePeople)
    is ApiError.NotenoughresourcesWrapper -> TownWorkRefusal.NotEnoughResources
    is ApiError.BuildingworknotfoundWrapper -> TownWorkRefusal.BuildingWorkNotFound(value.params.level)
    else -> TownWorkRefusal.Unrecognized
}

private val lessonRefusals: Map<BareApiError.Kind, TownLessonRefusal> = mapOf(
    BareApiError.Kind.StudySlotBusy to TownLessonRefusal.StudySlotBusy,
    BareApiError.Kind.LessonSchoolTooLow to TownLessonRefusal.LessonSchoolTooLow,
    BareApiError.Kind.LessonAlreadyStudied to TownLessonRefusal.LessonAlreadyStudied,
    BareApiError.Kind.LessonUnderStudy to TownLessonRefusal.LessonUnderStudy,
    BareApiError.Kind.LessonStudyNotFound to TownLessonRefusal.LessonStudyNotFound,
    BareApiError.Kind.TownNotFound to TownLessonRefusal.TownNotFound,
)

private fun WireRefusal.toLessonRefusal(): TownLessonRefusal = when (this) {
    is WireRefusal.Bare -> lessonRefusals[kind] ?: TownLessonRefusal.Unrecognized
    is WireRefusal.WithParams -> error.toLessonRefusal()
}

private fun ApiError.toLessonRefusal(): TownLessonRefusal = when (this) {
    is ApiError.LearningcapreachedWrapper ->
        TownLessonRefusal.LearningCapReached(cap = value.params.learningCap, inLearning = value.params.cardsInLearning)
    else -> TownLessonRefusal.Unrecognized
}

private fun WireRefusal.toHiringRefusal(): TownHiringRefusal = when (this) {
    is WireRefusal.Bare ->
        if (kind == BareApiError.Kind.TownNotFound) TownHiringRefusal.TownNotFound else TownHiringRefusal.Unrecognized
    is WireRefusal.WithParams -> error.toHiringRefusal()
}

private fun ApiError.toHiringRefusal(): TownHiringRefusal = when (this) {
    is ApiError.OfficetoolowWrapper -> TownHiringRefusal.OfficeTooLow(
        officeLevel = value.params.officeLevel,
        requiredOfficeLevel = value.params.requiredOfficeLevel,
    )
    is ApiError.HiringslotbusyWrapper -> TownHiringRefusal.HiringSlotBusy
    is ApiError.NotenoughpeopleWrapper ->
        TownHiringRefusal.NotEnoughPeople(required = value.params.requiredPeople, free = value.params.freePeople)
    is ApiError.NotenoughresourcesWrapper -> TownHiringRefusal.NotEnoughResources
    is ApiError.HiringordernotfoundWrapper -> TownHiringRefusal.HiringOrderNotFound
    else -> TownHiringRefusal.Unrecognized
}
