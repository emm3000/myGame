package com.emm.mygame.core.testing

import com.emm.mygame.core.network.MapReadResult
import com.emm.mygame.core.network.MapRepository
import kotlinx.coroutines.channels.Channel

class FakeMapRepository : MapRepository {

    private val answers: Channel<MapReadResult> = Channel(Channel.UNLIMITED)

    private val _requests: MutableList<Int?> = mutableListOf()

    val requests: List<Int?>
        get() = _requests.toList()

    fun answerRead(result: MapReadResult) {
        answers.trySend(result)
    }

    override suspend fun readOwn(): MapReadResult {
        _requests += null
        return answers.receive()
    }

    override suspend fun read(province: Int): MapReadResult {
        _requests += province
        return answers.receive()
    }
}
