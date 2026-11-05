package com.emm.mygame.core.testing

import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewHintResult
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.WordId
import kotlinx.coroutines.channels.Channel

class FakeLearningRepository : LearningRepository {

    private val readAnswers: Channel<ReviewsReadResult> = Channel(Channel.UNLIMITED)

    private val hintAnswers: Channel<ReviewHintResult> = Channel(Channel.UNLIMITED)

    private val reviewAnswers: Channel<ReviewAnswerResult> = Channel(Channel.UNLIMITED)

    private val _hints: MutableList<WordId> = mutableListOf()

    private val _answers: MutableList<AnswerRequest> = mutableListOf()

    var readCount: Int = 0
        private set

    val hints: List<WordId>
        get() = _hints.toList()

    val answers: List<AnswerRequest>
        get() = _answers.toList()

    fun answerRead(result: ReviewsReadResult) {
        readAnswers.trySend(result)
    }

    fun answerHint(result: ReviewHintResult) {
        hintAnswers.trySend(result)
    }

    fun answerReview(result: ReviewAnswerResult) {
        reviewAnswers.trySend(result)
    }

    override suspend fun reviews(): ReviewsReadResult {
        readCount += 1
        return readAnswers.receive()
    }

    override suspend fun hint(word: WordId): ReviewHintResult {
        _hints += word
        return hintAnswers.receive()
    }

    override suspend fun answer(word: WordId, answer: String): ReviewAnswerResult {
        _answers += AnswerRequest(word, answer)
        return reviewAnswers.receive()
    }

    data class AnswerRequest(val word: WordId, val answer: String)
}
