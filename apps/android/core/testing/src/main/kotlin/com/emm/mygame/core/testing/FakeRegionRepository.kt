package com.emm.mygame.core.testing

import com.emm.mygame.core.network.JobQuoteResult
import com.emm.mygame.core.network.JobTarget
import com.emm.mygame.core.network.RegionMapResult
import com.emm.mygame.core.network.RegionRepository
import com.emm.mygame.core.network.TownHireKind
import com.emm.mygame.core.network.TownJobResult
import kotlin.time.Instant
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.channels.Channel

class FakeRegionRepository(private val onAnswered: (TownJobResult.Answered) -> Unit) : RegionRepository {

    private val mapAnswers: Channel<RegionMapResult> = Channel(Channel.UNLIMITED)

    private val jobAnswers: Channel<TownJobResult> = Channel(Channel.UNLIMITED)

    private val quoteAnswers: MutableMap<JobRequest, CompletableDeferred<JobQuoteResult>> = mutableMapOf()

    private val _mapReads: MutableList<Int?> = mutableListOf()

    private val _jobSends: MutableList<JobRequest> = mutableListOf()

    private val _quotes: MutableList<JobRequest> = mutableListOf()

    private val _callBacks: MutableList<Instant> = mutableListOf()

    val mapReads: List<Int?>
        get() = _mapReads.toList()

    val jobSends: List<JobRequest>
        get() = _jobSends.toList()

    val quotes: List<JobRequest>
        get() = _quotes.toList()

    val callBacks: List<Instant>
        get() = _callBacks.toList()

    fun answerMap(result: RegionMapResult) {
        mapAnswers.trySend(result)
    }

    fun answerJob(result: TownJobResult) {
        jobAnswers.trySend(result)
    }

    fun answerQuote(request: JobRequest, result: JobQuoteResult) {
        quoteAnswerFor(request).complete(result)
    }

    override suspend fun readMap(area: Int?): RegionMapResult {
        _mapReads += area
        return mapAnswers.receive()
    }

    override suspend fun sendJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): TownJobResult {
        _jobSends += JobRequest(target, team, hours)
        return answeredJob()
    }

    override suspend fun quoteJob(target: JobTarget, team: Map<TownHireKind, Int>, hours: Int): JobQuoteResult {
        val request = JobRequest(target, team, hours)
        _quotes += request
        val answer: CompletableDeferred<JobQuoteResult> = quoteAnswerFor(request)
        return answer.await().also { quoteAnswers.remove(request, answer) }
    }

    override suspend fun callJobBack(sentAt: Instant): TownJobResult {
        _callBacks += sentAt
        return answeredJob()
    }

    private suspend fun answeredJob(): TownJobResult = jobAnswers.receive().also { answer: TownJobResult ->
        if (answer is TownJobResult.Answered) onAnswered(answer)
    }

    private fun quoteAnswerFor(request: JobRequest): CompletableDeferred<JobQuoteResult> =
        quoteAnswers.getOrPut(request) { CompletableDeferred() }

    data class JobRequest(val target: JobTarget, val team: Map<TownHireKind, Int>, val hours: Int)
}
