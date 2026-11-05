package com.emm.mygame.core.testing

import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownFoundResult
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownWorkResult
import kotlinx.coroutines.channels.Channel

class FakeTownRepository : TownRepository {

    private val readAnswers: Channel<TownReadResult> = Channel(Channel.UNLIMITED)

    private val foundAnswers: Channel<TownFoundResult> = Channel(Channel.UNLIMITED)

    private val workAnswers: Channel<TownWorkResult> = Channel(Channel.UNLIMITED)

    private val _foundings: MutableList<String> = mutableListOf()

    private val _starts: MutableList<TownBuildingKind> = mutableListOf()

    private val _stops: MutableList<StopRequest> = mutableListOf()

    var readCount: Int = 0
        private set

    val foundings: List<String>
        get() = _foundings.toList()

    val starts: List<TownBuildingKind>
        get() = _starts.toList()

    val stops: List<StopRequest>
        get() = _stops.toList()

    fun answerRead(result: TownReadResult) {
        readAnswers.trySend(result)
    }

    fun answerFound(result: TownFoundResult) {
        foundAnswers.trySend(result)
    }

    fun answerWork(result: TownWorkResult) {
        workAnswers.trySend(result)
    }

    override suspend fun read(): TownReadResult {
        readCount += 1
        return readAnswers.receive()
    }

    override suspend fun found(name: String): TownFoundResult {
        _foundings += name
        return foundAnswers.receive()
    }

    override suspend fun startWork(building: TownBuildingKind): TownWorkResult {
        _starts += building
        return workAnswers.receive()
    }

    override suspend fun stopWork(building: TownBuildingKind, level: Int): TownWorkResult {
        _stops += StopRequest(building, level)
        return workAnswers.receive()
    }

    data class StopRequest(val building: TownBuildingKind, val level: Int)
}
