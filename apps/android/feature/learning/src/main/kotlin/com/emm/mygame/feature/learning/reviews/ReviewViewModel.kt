package com.emm.mygame.feature.learning.reviews

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.DueReview
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.ReviewAnswerResult
import com.emm.mygame.core.model.learning.ReviewHintResult
import com.emm.mygame.core.model.learning.ReviewVerdict
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownReader
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.gapOf
import com.emm.mygame.core.model.town.serverNow
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.launch

class ReviewViewModel(
    private val learning: LearningRepository,
    private val towns: TownReader,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<ReviewUiState> = MutableStateFlow(ReviewUiState.Loading)

    val state: StateFlow<ReviewUiState> = _state.asStateFlow()

    private val _effects: Channel<ReviewEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<ReviewEffect> = _effects.receiveAsFlow()

    private var reads: ReviewReads = ReviewReads.none

    private var server: ReviewServerView = ReviewServerView.none

    private var walked: Int = 0

    private var isShown: Boolean = true

    init {
        viewModelScope.launch { towns.town.collect { held: HeldTown? -> townChanged(held?.town) } }
        viewModelScope.launch { towns.read() }
        open()
    }

    fun onIntent(intent: ReviewIntent) {
        when (intent) {
            ReviewIntent.ScreenShown -> show()
            ReviewIntent.ScreenHidden -> {
                isShown = false
                reads.cancel()
            }
            ReviewIntent.RetryTapped -> retry()
            is ReviewIntent.ChoiceChosen -> edit { card: ReviewUiState.ReviewCard ->
                (card as? ReviewUiState.ReviewCard.Recognition)?.copy(chosen = intent.choice) ?: card
            }
            is ReviewIntent.AnswerChanged -> edit { card: ReviewUiState.ReviewCard ->
                (card as? ReviewUiState.ReviewCard.Recall)?.copy(typed = intent.answer) ?: card
            }
            is ReviewIntent.SupportTapped -> tapSupport(intent.spanIndex)
            ReviewIntent.HintTapped -> hint()
            ReviewIntent.CheckTapped -> check()
            ReviewIntent.NextTapped -> next()
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        when (val shown: ReviewUiState = _state.value) {
            ReviewUiState.Loading -> open()
            is ReviewUiState.NothingDue -> wait(shown.dueAt + server.gap)
            ReviewUiState.Failed,
            ReviewUiState.NoCards,
            is ReviewUiState.LessonReady,
            is ReviewUiState.Reviewing,
            -> Unit
        }
    }

    private fun retry() {
        val isWaiting: Boolean = (_state.value as? ReviewUiState.Reviewing)?.isBusy == true
        if (!isWaiting) open()
    }

    private fun open() {
        reads.cancel()
        _state.value = ReviewUiState.Loading
        val reading: Job = viewModelScope.launch {
            when (val answer: ReviewsReadResult = learning.reviews()) {
                ReviewsReadResult.Unreachable -> _state.value = ReviewUiState.Failed
                is ReviewsReadResult.Read -> present(measured(answer.reviews), isDealtFromStack = false)
            }
        }
        reads = reads.copy(reading = reading)
    }

    private fun wait(nextDueAt: Instant) {
        val rereading: Job = viewModelScope.launch { rereadWhenDue(nextDueAt) }
        reads = reads.copy(rereading = rereading)
    }

    private fun townChanged(town: TownSnapshot?) {
        when (val shown: ReviewUiState = _state.value) {
            is ReviewUiState.NothingDue -> _state.value = shown.copy(path = town?.let(::lessonPathOf))
            is ReviewUiState.LessonReady -> _state.value = shown.copy(number = shownNumberOf(town, shown.lesson))
            else -> Unit
        }
    }

    private fun present(reviews: DueReviews, isDealtFromStack: Boolean) {
        val baseline: List<LessonId> = server.readFirstOnArrival ?: reviews.readFirst.also { read: List<LessonId> ->
            server = server.copy(readFirstOnArrival = read)
        }
        val first: DueReview? = reviews.due.firstOrNull()
        val nextDueAt: Instant? = reviews.nextDueAt
        when {
            first != null && first.lesson in reviews.readFirst && first.lesson !in baseline ->
                _state.value = ReviewUiState.LessonReady(
                    lesson = first.lesson,
                    number = shownNumberOf(towns.town.value?.town, first.lesson),
                )
            first != null -> _state.value = ReviewUiState.Reviewing(
                walked = walked,
                dueCount = reviews.due.size,
                card = reviewCardOf(first),
                step = ReviewUiState.ReviewStep.Answering,
                isDealtFromStack = isDealtFromStack,
            )
            nextDueAt == null -> _state.value = ReviewUiState.NoCards
            else -> wait(nextDueAt)
        }
    }

    private suspend fun rereadWhenDue(nextDueAt: Instant) {
        _state.value = endAt(nextDueAt)
        delay(countdownTo(finishesAt = nextDueAt, now = serverNow(clock, server.gap)))
        var answer: ReviewsReadResult = learning.reviews()
        while (answer !is ReviewsReadResult.Read) {
            delay(repaintDelay(null))
            answer = learning.reviews()
        }
        present(measured(answer.reviews), isDealtFromStack = false)
    }

    private fun endAt(nextDueAt: Instant): ReviewUiState.NothingDue = ReviewUiState.NothingDue(
        dueAt = nextDueAt - server.gap,
        path = towns.town.value?.town?.let(::lessonPathOf),
    )

    private fun tapSupport(spanIndex: Int) {
        val reviewing: ReviewUiState.Reviewing = _state.value as? ReviewUiState.Reviewing ?: return
        _state.value = reviewing.copy(card = reviewing.card.withSupportTapped(spanIndex))
    }

    private fun edit(change: (ReviewUiState.ReviewCard) -> ReviewUiState.ReviewCard) {
        val reviewing: ReviewUiState.Reviewing = answerable() ?: return
        _state.value = reviewing.copy(card = change(reviewing.card))
    }

    private fun hint() {
        val reviewing: ReviewUiState.Reviewing = answerable() ?: return
        val recall: ReviewUiState.ReviewCard.Recall = reviewing.card as? ReviewUiState.ReviewCard.Recall ?: return
        _state.value = reviewing.copy(step = ReviewUiState.ReviewStep.Hinting)
        viewModelScope.launch {
            when (val answer: ReviewHintResult = learning.hint(recall.wordId)) {
                is ReviewHintResult.Hinted -> drawn { current: ReviewUiState.Reviewing ->
                    current.copy(card = current.card.withHint(answer.hint), step = ReviewUiState.ReviewStep.Answering)
                }
                is ReviewHintResult.Refused -> stepTo(ReviewUiState.ReviewStep.Refused(answer.refusal))
                ReviewHintResult.Unreachable -> stepTo(ReviewUiState.ReviewStep.Unreachable)
            }
        }
    }

    private fun check() {
        val reviewing: ReviewUiState.Reviewing = answerable() ?: return
        val answer: String = reviewing.card.sentAnswer() ?: return
        _state.value = reviewing.copy(step = ReviewUiState.ReviewStep.Checking)
        viewModelScope.launch {
            when (val result: ReviewAnswerResult = learning.answer(reviewing.card.wordId, answer)) {
                is ReviewAnswerResult.Answered -> rated(reviewing.card, result.verdict)
                is ReviewAnswerResult.Refused -> stepTo(ReviewUiState.ReviewStep.Refused(result.refusal))
                ReviewAnswerResult.Unreachable -> stepTo(ReviewUiState.ReviewStep.Unreachable)
            }
        }
    }

    private suspend fun rated(card: ReviewUiState.ReviewCard, verdict: ReviewVerdict) {
        val step: ReviewUiState.ReviewStep = when (verdict) {
            ReviewVerdict.NearMiss -> return stepTo(ReviewUiState.ReviewStep.NearMiss)
            is ReviewVerdict.Correct -> ReviewUiState.ReviewStep.Correct(
                skill = verdict.earnedSkill?.let(::skillLineOf),
                openedLevel = verdict.openedLevel,
            )
            is ReviewVerdict.Wrong -> ReviewUiState.ReviewStep.Wrong(correct = correctFormOf(card, verdict))
        }
        _effects.send(ReviewEffect.Answered)
        val reread: DueReviews? = (learning.reviews() as? ReviewsReadResult.Read)?.reviews?.let(::measured)
        server = server.copy(reread = reread)
        stepTo(step)
    }

    private fun next() {
        val reviewing: ReviewUiState.Reviewing = _state.value as? ReviewUiState.Reviewing ?: return
        if (!reviewing.isRated) return
        walked += 1
        val reviews: DueReviews = server.reread ?: return open()
        server = server.copy(reread = null)
        present(reviews, isDealtFromStack = reviewing.step is ReviewUiState.ReviewStep.Correct)
    }

    private fun answerable(): ReviewUiState.Reviewing? =
        (_state.value as? ReviewUiState.Reviewing)?.takeIf { reviewing: ReviewUiState.Reviewing ->
            !reviewing.isBusy && !reviewing.isRated
        }

    private fun stepTo(step: ReviewUiState.ReviewStep) {
        drawn { current: ReviewUiState.Reviewing -> current.copy(step = step) }
    }

    private fun drawn(change: (ReviewUiState.Reviewing) -> ReviewUiState.Reviewing) {
        val current: ReviewUiState.Reviewing = _state.value as? ReviewUiState.Reviewing ?: return
        _state.value = change(current)
    }

    private fun measured(read: DueReviews): DueReviews {
        server = server.copy(gap = gapOf(read.readAt, clock))
        return read
    }
}
