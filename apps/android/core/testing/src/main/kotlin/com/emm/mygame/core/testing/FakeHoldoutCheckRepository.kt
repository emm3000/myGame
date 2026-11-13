package com.emm.mygame.core.testing

import com.emm.mygame.core.network.HoldoutCheckChangeResult
import com.emm.mygame.core.network.HoldoutCheckRepository
import com.emm.mygame.core.network.HoldoutCheckWeek
import com.emm.mygame.core.network.HoldoutChecksReadResult
import com.emm.mygame.core.network.PlacementAnswer
import com.emm.mygame.core.network.PlacementBand
import kotlinx.coroutines.channels.Channel

class FakeHoldoutCheckRepository : HoldoutCheckRepository {

    private val readAnswers: Channel<HoldoutChecksReadResult> = Channel(Channel.UNLIMITED)

    private val changeAnswers: Channel<HoldoutCheckChangeResult> = Channel(Channel.UNLIMITED)

    private val _changes: MutableList<HoldoutCheckChange> = mutableListOf()

    val changes: List<HoldoutCheckChange>
        get() = _changes.toList()

    var readCount: Int = 0
        private set

    fun answerRead(result: HoldoutChecksReadResult) {
        readAnswers.trySend(result)
    }

    fun answerChange(result: HoldoutCheckChangeResult) {
        changeAnswers.trySend(result)
    }

    override suspend fun read(): HoldoutChecksReadResult {
        readCount += 1
        return readAnswers.receive()
    }

    override suspend fun begin(band: PlacementBand, week: HoldoutCheckWeek): HoldoutCheckChangeResult =
        changed(HoldoutCheckChange.Begin(band, week))

    override suspend fun skip(band: PlacementBand, week: HoldoutCheckWeek): HoldoutCheckChangeResult =
        changed(HoldoutCheckChange.Skip(band, week))

    override suspend fun answer(
        band: PlacementBand,
        week: HoldoutCheckWeek,
        answers: List<PlacementAnswer>,
    ): HoldoutCheckChangeResult = changed(HoldoutCheckChange.Answer(band, week, answers))

    private suspend fun changed(change: HoldoutCheckChange): HoldoutCheckChangeResult {
        _changes += change
        return changeAnswers.receive()
    }
}
