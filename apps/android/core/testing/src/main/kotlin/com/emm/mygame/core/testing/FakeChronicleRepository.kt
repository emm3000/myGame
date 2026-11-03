package com.emm.mygame.core.testing

import com.emm.mygame.core.network.ChronicleReadResult
import com.emm.mygame.core.network.ChronicleRepository
import com.emm.mygame.core.network.FiefId
import kotlinx.coroutines.channels.Channel

class FakeChronicleRepository : ChronicleRepository {

    private val answers: Channel<ChronicleReadResult> = Channel(Channel.UNLIMITED)

    private val _reads: MutableList<FiefId> = mutableListOf()

    val reads: List<FiefId>
        get() = _reads.toList()

    val readCount: Int
        get() = _reads.size

    fun answerRead(result: ChronicleReadResult) {
        answers.trySend(result)
    }

    override suspend fun read(fief: FiefId): ChronicleReadResult {
        _reads += fief
        return answers.receive()
    }
}
