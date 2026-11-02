package com.emm.mygame.core.testing

import com.emm.mygame.core.network.FiefReadResult
import com.emm.mygame.core.network.FiefRepository
import kotlinx.coroutines.channels.Channel

class FakeFiefRepository : FiefRepository {

    private val answers: Channel<FiefReadResult> = Channel(Channel.UNLIMITED)

    var readCount: Int = 0
        private set

    fun answerRead(result: FiefReadResult) {
        answers.trySend(result)
    }

    override suspend fun read(): FiefReadResult {
        readCount += 1
        return answers.receive()
    }
}
