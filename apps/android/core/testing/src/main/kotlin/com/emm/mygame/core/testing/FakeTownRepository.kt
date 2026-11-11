package com.emm.mygame.core.testing

import com.emm.mygame.core.network.HeldTown
import com.emm.mygame.core.network.JobTarget
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.RegionMapResult
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundResult
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownHiringResult
import com.emm.mygame.core.network.TownJobResult
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.TownWorkResult
import kotlin.time.Duration
import kotlin.time.Instant
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeTownRepository : TownRepository {

    private val _town: MutableStateFlow<HeldTown?> = MutableStateFlow(null)

    override val town: StateFlow<HeldTown?> = _town.asStateFlow()

    private val readAnswers: Channel<TownReadResult> = Channel(Channel.UNLIMITED)

    private val foundAnswers: Channel<TownFoundResult> = Channel(Channel.UNLIMITED)

    private val workAnswers: Channel<TownWorkResult> = Channel(Channel.UNLIMITED)

    private val lessonAnswers: Channel<TownLessonResult> = Channel(Channel.UNLIMITED)

    private val hiringAnswers: Channel<TownHiringResult> = Channel(Channel.UNLIMITED)

    private val mapAnswers: Channel<RegionMapResult> = Channel(Channel.UNLIMITED)

    private val jobAnswers: Channel<TownJobResult> = Channel(Channel.UNLIMITED)

    private val _foundings: MutableList<String> = mutableListOf()

    private val _starts: MutableList<TownBuildingKind> = mutableListOf()

    private val _stops: MutableList<StopRequest> = mutableListOf()

    private val _lessonStarts: MutableList<LessonId> = mutableListOf()

    private val _lessonStops: MutableList<LessonId> = mutableListOf()

    private val _hirings: MutableList<HiringRequest> = mutableListOf()

    private val _hiringStops: MutableList<HiringStopRequest> = mutableListOf()

    private val _mapReads: MutableList<Int?> = mutableListOf()

    private val _jobSends: MutableList<JobRequest> = mutableListOf()

    private val _callBacks: MutableList<Instant> = mutableListOf()

    var readCount: Int = 0
        private set

    val foundings: List<String>
        get() = _foundings.toList()

    val starts: List<TownBuildingKind>
        get() = _starts.toList()

    val stops: List<StopRequest>
        get() = _stops.toList()

    val lessonStarts: List<LessonId>
        get() = _lessonStarts.toList()

    val lessonStops: List<LessonId>
        get() = _lessonStops.toList()

    val hirings: List<HiringRequest>
        get() = _hirings.toList()

    val hiringStops: List<HiringStopRequest>
        get() = _hiringStops.toList()

    val mapReads: List<Int?>
        get() = _mapReads.toList()

    val jobSends: List<JobRequest>
        get() = _jobSends.toList()

    val callBacks: List<Instant>
        get() = _callBacks.toList()

    fun hold(held: HeldTown) {
        _town.value = held
    }

    fun answerRead(result: TownReadResult) {
        readAnswers.trySend(result)
    }

    fun answerFound(result: TownFoundResult) {
        foundAnswers.trySend(result)
    }

    fun answerWork(result: TownWorkResult) {
        workAnswers.trySend(result)
    }

    fun answerLesson(result: TownLessonResult) {
        lessonAnswers.trySend(result)
    }

    fun answerHiring(result: TownHiringResult) {
        hiringAnswers.trySend(result)
    }

    fun answerMap(result: RegionMapResult) {
        mapAnswers.trySend(result)
    }

    fun answerJob(result: TownJobResult) {
        jobAnswers.trySend(result)
    }

    override suspend fun read(): TownReadResult {
        readCount += 1
        val answer: TownReadResult = readAnswers.receive()
        when (answer) {
            is TownReadResult.Read -> _town.holdAnswered(answer.town)
            TownReadResult.NoTown -> _town.value = null
            TownReadResult.Unreachable -> Unit
        }
        return answer
    }

    override suspend fun found(name: String): TownFoundResult {
        _foundings += name
        return foundAnswers.answered(_town, TownFoundResult::answeredTown)
    }

    override suspend fun startWork(building: TownBuildingKind): TownWorkResult {
        _starts += building
        return workAnswers.answered(_town, TownWorkResult::answeredTown)
    }

    override suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult {
        _stops += StopRequest(building, level)
        return workAnswers.answered(_town, TownWorkResult::answeredTown)
    }

    override suspend fun startLesson(lesson: LessonId): TownLessonResult {
        _lessonStarts += lesson
        return lessonAnswers.answered(_town, TownLessonResult::answeredTown)
    }

    override suspend fun stopLesson(lesson: LessonId): TownLessonResult {
        _lessonStops += lesson
        return lessonAnswers.answered(_town, TownLessonResult::answeredTown)
    }

    override suspend fun placeHiring(hire: TownHireKind, count: Int): TownHiringResult {
        _hirings += HiringRequest(hire, count)
        return hiringAnswers.answered(_town, TownHiringResult::answeredTown)
    }

    override suspend fun stopHiring(hire: TownHireKind, startedAt: Instant): TownHiringResult {
        _hiringStops += HiringStopRequest(hire, startedAt)
        return hiringAnswers.answered(_town, TownHiringResult::answeredTown)
    }

    override suspend fun readMap(area: Int?): RegionMapResult {
        _mapReads += area
        return mapAnswers.receive()
    }

    override suspend fun sendJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): TownJobResult {
        _jobSends += JobRequest(target, team, hours)
        return jobAnswers.answered(_town, TownJobResult::answeredTown)
    }

    override suspend fun callJobBack(sentAt: Instant): TownJobResult {
        _callBacks += sentAt
        return jobAnswers.answered(_town, TownJobResult::answeredTown)
    }

    data class StopRequest(val building: TownBuildingKind, val level: Int)

    data class HiringRequest(val hire: TownHireKind, val count: Int)

    data class HiringStopRequest(val hire: TownHireKind, val startedAt: Instant)

    data class JobRequest(val target: JobTarget, val team: Map<TownHireKind, Int>, val hours: Int)
}

private suspend fun <Answer> Channel<Answer>.answered(
    town: MutableStateFlow<HeldTown?>,
    answeredTown: (Answer) -> TownSnapshot?,
): Answer = receive().also { answer: Answer -> answeredTown(answer)?.let(town::holdAnswered) }

private fun MutableStateFlow<HeldTown?>.holdAnswered(town: TownSnapshot) {
    value = HeldTown(town, gap = value?.gap ?: Duration.ZERO)
}

private fun TownFoundResult.answeredTown(): TownSnapshot? = (this as? TownFoundResult.Founded)?.town

private fun TownWorkResult.answeredTown(): TownSnapshot? = (this as? TownWorkResult.Answered)?.town

private fun TownLessonResult.answeredTown(): TownSnapshot? = (this as? TownLessonResult.Answered)?.town

private fun TownHiringResult.answeredTown(): TownSnapshot? = (this as? TownHiringResult.Answered)?.town

private fun TownJobResult.answeredTown(): TownSnapshot? = (this as? TownJobResult.Answered)?.town
