package com.emm.mygame.core.testing

import com.emm.mygame.core.model.learning.KeepGoingRepository
import com.emm.mygame.core.model.learning.KeepGoingResult
import kotlinx.coroutines.channels.Channel

class FakeKeepGoingRepository : KeepGoingRepository {

    private val answers: Channel<KeepGoingResult> = Channel(Channel.UNLIMITED)

    var reads: Int = 0
        private set

    fun answerFrames(result: KeepGoingResult) {
        answers.trySend(result)
    }

    override suspend fun readFrames(): KeepGoingResult {
        reads += 1
        return answers.receive()
    }
}
