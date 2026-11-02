package com.emm.mygame.core.testing

import com.emm.mygame.core.network.ChronicleReadResult
import com.emm.mygame.core.network.ChronicleRepository
import kotlinx.coroutines.channels.Channel

class FakeChronicleRepository : ChronicleRepository {

    private val answers: Channel<ChronicleReadResult> = Channel(Channel.UNLIMITED)

    var readCount: Int = 0
        private set

    fun answerRead(result: ChronicleReadResult) {
        answers.trySend(result)
    }

    override suspend fun read(): ChronicleReadResult {
        readCount += 1
        return answers.receive()
    }
}
