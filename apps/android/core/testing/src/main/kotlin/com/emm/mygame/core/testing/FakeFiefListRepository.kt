package com.emm.mygame.core.testing

import com.emm.mygame.core.network.FiefListRepository
import com.emm.mygame.core.network.FiefListResult
import com.emm.mygame.core.network.FirstFiefResult
import kotlinx.coroutines.channels.Channel

class FakeFiefListRepository : FiefListRepository {

    private val answers: Channel<FirstFiefResult> = Channel(Channel.UNLIMITED)

    private val lists: Channel<FiefListResult> = Channel(Channel.UNLIMITED)

    var firstListedCount: Int = 0
        private set

    var listedCount: Int = 0
        private set

    fun answerFirstListed(result: FirstFiefResult) {
        answers.trySend(result)
    }

    fun answerListed(result: FiefListResult) {
        lists.trySend(result)
    }

    override suspend fun firstListed(): FirstFiefResult {
        firstListedCount += 1
        return answers.receive()
    }

    override suspend fun listed(): FiefListResult {
        listedCount += 1
        return lists.receive()
    }
}
