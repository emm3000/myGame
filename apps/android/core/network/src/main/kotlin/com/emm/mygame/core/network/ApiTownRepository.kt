package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.apis.DefaultApi
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.FoundTown
import com.emm.mygame.core.network.generated.models.StartBuildingWork
import com.emm.mygame.core.network.generated.models.StartLessonRequest
import com.emm.mygame.core.network.generated.models.TownOverview
import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext
import kotlinx.serialization.SerializationException
import retrofit2.Response

internal class ApiTownRepository(
    private val api: DefaultApi,
    private val ioDispatcher: CoroutineDispatcher,
) : TownRepository {

    override suspend fun read(): TownReadResult = withContext(ioDispatcher) {
        try {
            readOrNoTown(api.townGet())
        } catch (expectedOutage: IOException) {
            TownReadResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            TownReadResult.Unreachable
        }
    }

    override suspend fun found(name: String): TownFoundResult = withContext(ioDispatcher) {
        try {
            foundedOrRefused(api.townPost(FoundTown(name = name)))
        } catch (expectedOutage: IOException) {
            TownFoundResult.Unreachable
        } catch (expectedMalformedBody: SerializationException) {
            TownFoundResult.Unreachable
        }
    }

    override suspend fun startWork(building: TownBuildingKind): TownWorkResult = working {
        api.townWorkPost(StartBuildingWork(building = building.toWireBuilding()))
    }

    override suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult = working {
        api.townWorkBuildingLevelDelete(building = building.toWireBuilding().value, level = level.toString())
    }

    override suspend fun startLesson(lesson: LessonId): TownLessonResult = studying {
        api.townLessonsPost(StartLessonRequest(lessonId = lesson.value))
    }

    override suspend fun stopLesson(lesson: LessonId): TownLessonResult = studying {
        api.townLessonsLessonIdDelete(lessonId = lesson.value)
    }

    private suspend fun working(call: suspend () -> Response<TownOverview>): TownWorkResult =
        withContext(ioDispatcher) {
            try {
                answeredOrRefused(call())
            } catch (expectedOutage: IOException) {
                TownWorkResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                TownWorkResult.Unreachable
            }
        }

    private suspend fun studying(call: suspend () -> Response<TownOverview>): TownLessonResult =
        withContext(ioDispatcher) {
            try {
                lessonAnsweredOrRefused(call())
            } catch (expectedOutage: IOException) {
                TownLessonResult.Unreachable
            } catch (expectedMalformedBody: SerializationException) {
                TownLessonResult.Unreachable
            }
        }

    private fun readOrNoTown(response: Response<TownOverview>): TownReadResult {
        val snapshot: TownSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) TownReadResult.Unreachable else TownReadResult.Read(snapshot)
        }
        val isNoTown: Boolean = response.wireRefusal()?.bareKind() == BareApiError.Kind.TownNotFound
        return if (isNoTown) TownReadResult.NoTown else TownReadResult.Unreachable
    }

    private fun foundedOrRefused(response: Response<TownOverview>): TownFoundResult {
        val snapshot: TownSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) TownFoundResult.Unreachable else TownFoundResult.Founded(snapshot)
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return TownFoundResult.Unreachable
        return TownFoundResult.Refused(refusal.toFoundRefusal())
    }

    private fun answeredOrRefused(response: Response<TownOverview>): TownWorkResult {
        val snapshot: TownSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) TownWorkResult.Unreachable else TownWorkResult.Answered(snapshot)
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return TownWorkResult.Unreachable
        return TownWorkResult.Refused(refusal.toWorkRefusal())
    }

    private fun lessonAnsweredOrRefused(response: Response<TownOverview>): TownLessonResult {
        val snapshot: TownSnapshot? = response.body()?.toSnapshot()
        if (response.isSuccessful) {
            return if (snapshot == null) TownLessonResult.Unreachable else TownLessonResult.Answered(snapshot)
        }
        val refusal: WireRefusal = response.wireRefusal() ?: return TownLessonResult.Unreachable
        return TownLessonResult.Refused(refusal.toLessonRefusal())
    }
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
