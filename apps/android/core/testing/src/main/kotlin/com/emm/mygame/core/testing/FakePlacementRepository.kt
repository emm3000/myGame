package com.emm.mygame.core.testing

import com.emm.mygame.core.network.PlacementAnswer
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.PlacementChangeResult
import com.emm.mygame.core.network.PlacementReadResult
import com.emm.mygame.core.network.PlacementRepository
import kotlinx.coroutines.channels.Channel

class FakePlacementRepository : PlacementRepository {

    private val readAnswers: Channel<PlacementReadResult> = Channel(Channel.UNLIMITED)

    private val changeAnswers: Channel<PlacementChangeResult> = Channel(Channel.UNLIMITED)

    private val _changes: MutableList<PlacementChange> = mutableListOf()

    val changes: List<PlacementChange>
        get() = _changes.toList()

    var readCount: Int = 0
        private set

    fun answerRead(result: PlacementReadResult) {
        readAnswers.trySend(result)
    }

    fun answerChange(result: PlacementChangeResult) {
        changeAnswers.trySend(result)
    }

    override suspend fun read(): PlacementReadResult {
        readCount += 1
        return readAnswers.receive()
    }

    override suspend fun begin(): PlacementChangeResult = changed(PlacementChange.Begin)

    override suspend fun skip(): PlacementChangeResult = changed(PlacementChange.Skip)

    override suspend fun answer(band: PlacementBand, answers: List<PlacementAnswer>): PlacementChangeResult =
        changed(PlacementChange.Answer(band, answers))

    private suspend fun changed(change: PlacementChange): PlacementChangeResult {
        _changes += change
        return changeAnswers.receive()
    }
}
