package com.emm.mygame.core.testing

import com.emm.mygame.core.network.FiefId
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewHintResult
import com.emm.mygame.core.network.StudyResult
import com.emm.mygame.core.network.WordId
import kotlinx.coroutines.channels.Channel

class FakeLearningRepository : LearningRepository {

    private val lessonAnswers: Channel<StudyResult> = Channel(Channel.UNLIMITED)

    private val hintAnswers: Channel<ReviewHintResult> = Channel(Channel.UNLIMITED)

    private val reviewAnswers: Channel<ReviewAnswerResult> = Channel(Channel.UNLIMITED)

    private val _lessons: MutableList<LessonRequest> = mutableListOf()

    private val _hints: MutableList<HintRequest> = mutableListOf()

    private val _answers: MutableList<AnswerRequest> = mutableListOf()

    val lessons: List<LessonRequest>
        get() = _lessons.toList()

    val hints: List<HintRequest>
        get() = _hints.toList()

    val answers: List<AnswerRequest>
        get() = _answers.toList()

    fun answerLesson(result: StudyResult) {
        lessonAnswers.trySend(result)
    }

    fun answerHint(result: ReviewHintResult) {
        hintAnswers.trySend(result)
    }

    fun answerReview(result: ReviewAnswerResult) {
        reviewAnswers.trySend(result)
    }

    override suspend fun startLesson(fief: FiefId, lesson: LessonId): StudyResult {
        _lessons += LessonRequest.Start(fief, lesson)
        return lessonAnswers.receive()
    }

    override suspend fun cancelLesson(fief: FiefId, lesson: LessonId): StudyResult {
        _lessons += LessonRequest.Cancel(fief, lesson)
        return lessonAnswers.receive()
    }

    override suspend fun hint(fief: FiefId, word: WordId): ReviewHintResult {
        _hints += HintRequest(fief, word)
        return hintAnswers.receive()
    }

    override suspend fun answer(fief: FiefId, word: WordId, answer: String): ReviewAnswerResult {
        _answers += AnswerRequest(fief, word, answer)
        return reviewAnswers.receive()
    }

    sealed interface LessonRequest {

        data class Start(val fief: FiefId, val lesson: LessonId) : LessonRequest

        data class Cancel(val fief: FiefId, val lesson: LessonId) : LessonRequest
    }

    data class HintRequest(val fief: FiefId, val word: WordId)

    data class AnswerRequest(val fief: FiefId, val word: WordId, val answer: String)
}
