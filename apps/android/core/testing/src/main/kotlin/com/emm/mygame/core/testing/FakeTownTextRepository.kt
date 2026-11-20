package com.emm.mygame.core.testing

import com.emm.mygame.core.network.TextId
import com.emm.mygame.core.network.TownTextRepository
import com.emm.mygame.core.network.TownTextResult
import kotlinx.coroutines.channels.Channel

class FakeTownTextRepository : TownTextRepository {

    private val answers: Channel<TownTextResult> = Channel(Channel.UNLIMITED)

    private val _reads: MutableList<TextId> = mutableListOf()

    val reads: List<TextId>
        get() = _reads.toList()

    fun answerText(result: TownTextResult) {
        answers.trySend(result)
    }

    override suspend fun readText(text: TextId): TownTextResult {
        _reads += text
        return answers.receive()
    }
}
