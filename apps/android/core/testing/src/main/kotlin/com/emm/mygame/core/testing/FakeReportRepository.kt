package com.emm.mygame.core.testing

import com.emm.mygame.core.network.ReportCloseResult
import com.emm.mygame.core.network.ReportReadResult
import com.emm.mygame.core.network.ReportRepository
import com.emm.mygame.core.network.TownNewsReadResult
import kotlinx.coroutines.channels.Channel

class FakeReportRepository : ReportRepository {

    private val readAnswers: Channel<ReportReadResult> = Channel(Channel.UNLIMITED)

    private val closeAnswers: Channel<ReportCloseResult> = Channel(Channel.UNLIMITED)

    private val newsAnswers: Channel<TownNewsReadResult> = Channel(Channel.UNLIMITED)

    var readCount: Int = 0
        private set

    var newsReadCount: Int = 0
        private set

    var closeCount: Int = 0
        private set

    fun answerRead(result: ReportReadResult) {
        readAnswers.trySend(result)
    }

    fun answerClose(result: ReportCloseResult) {
        closeAnswers.trySend(result)
    }

    fun answerNews(result: TownNewsReadResult) {
        newsAnswers.trySend(result)
    }

    override suspend fun read(): ReportReadResult {
        readCount += 1
        return readAnswers.receive()
    }

    override suspend fun close(): ReportCloseResult {
        closeCount += 1
        return closeAnswers.receive()
    }

    override suspend fun news(): TownNewsReadResult {
        newsReadCount += 1
        return newsAnswers.receive()
    }
}
