package com.emm.mygame.core.testing

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.RetainedWords
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundResult
import com.emm.mygame.core.network.TownLessonResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.TownWorkResult
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class FakeTownRepository : TownRepository {

    private val _retainedWords: MutableStateFlow<RetainedWords?> = MutableStateFlow(null)

    override val retainedWords: StateFlow<RetainedWords?> = _retainedWords.asStateFlow()

    private val readAnswers: Channel<TownReadResult> = Channel(Channel.UNLIMITED)

    private val foundAnswers: Channel<TownFoundResult> = Channel(Channel.UNLIMITED)

    private val workAnswers: Channel<TownWorkResult> = Channel(Channel.UNLIMITED)

    private val lessonAnswers: Channel<TownLessonResult> = Channel(Channel.UNLIMITED)

    private val _foundings: MutableList<String> = mutableListOf()

    private val _starts: MutableList<TownBuildingKind> = mutableListOf()

    private val _stops: MutableList<StopRequest> = mutableListOf()

    private val _lessonStarts: MutableList<LessonId> = mutableListOf()

    private val _lessonStops: MutableList<LessonId> = mutableListOf()

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

    override suspend fun read(): TownReadResult {
        readCount += 1
        val answer: TownReadResult = readAnswers.receive()
        when (answer) {
            is TownReadResult.Read -> hold(answer.town)
            TownReadResult.NoTown -> _retainedWords.value = null
            TownReadResult.Unreachable -> Unit
        }
        return answer
    }

    override suspend fun found(name: String): TownFoundResult {
        _foundings += name
        return foundAnswers.receive().also { answer: TownFoundResult ->
            if (answer is TownFoundResult.Founded) hold(answer.town)
        }
    }

    override suspend fun startWork(building: TownBuildingKind): TownWorkResult {
        _starts += building
        return answeredWork()
    }

    override suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult {
        _stops += StopRequest(building, level)
        return answeredWork()
    }

    override suspend fun startLesson(lesson: LessonId): TownLessonResult {
        _lessonStarts += lesson
        return answeredLesson()
    }

    override suspend fun stopLesson(lesson: LessonId): TownLessonResult {
        _lessonStops += lesson
        return answeredLesson()
    }

    private suspend fun answeredWork(): TownWorkResult = workAnswers.receive().also { answer: TownWorkResult ->
        if (answer is TownWorkResult.Answered) hold(answer.town)
    }

    private suspend fun answeredLesson(): TownLessonResult = lessonAnswers.receive().also { answer: TownLessonResult ->
        if (answer is TownLessonResult.Answered) hold(answer.town)
    }

    private fun hold(town: TownSnapshot) {
        _retainedWords.value = town.learning.retainedWords
    }

    data class StopRequest(val building: TownBuildingKind, val level: Int)
}
