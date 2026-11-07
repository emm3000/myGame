package com.emm.mygame.feature.fief

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.DueReview
import com.emm.mygame.core.network.DueReviews
import com.emm.mygame.core.network.LearningRepository
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.RaisedSkill
import com.emm.mygame.core.network.ReviewAnswerResult
import com.emm.mygame.core.network.ReviewHintResult
import com.emm.mygame.core.network.ReviewVerdict
import com.emm.mygame.core.network.ReviewsReadResult
import com.emm.mygame.core.network.TownRepository
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordStanding
import com.emm.mygame.core.network.numberOf
import com.emm.mygame.core.network.schoolPathCountsOf
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.repaintDelay
import kotlin.time.Clock
import kotlin.time.Duration
import kotlin.math.floor
import kotlin.time.Instant
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ReviewViewModel(
    private val learning: LearningRepository,
    private val towns: TownRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<ReviewUiState> = MutableStateFlow(ReviewUiState.Loading)

    val state: StateFlow<ReviewUiState> = _state.asStateFlow()

    private var reading: Job? = null

    private var reread: DueReviews? = null

    private var gap: Duration = Duration.ZERO

    private var walked: Int = 0

    private var arrival: List<LessonId>? = null

    init {
        viewModelScope.launch { towns.town.collect(::townChanged) }
        readTown()
        open()
    }

    fun onIntent(intent: ReviewIntent) {
        when (intent) {
            ReviewIntent.RetryTapped -> retry()
            is ReviewIntent.ChoiceChosen -> edit { card: ReviewUiState.ReviewCard ->
                (card as? ReviewUiState.ReviewCard.Recognition)?.copy(chosen = intent.choice) ?: card
            }
            is ReviewIntent.AnswerChanged -> edit { card: ReviewUiState.ReviewCard ->
                (card as? ReviewUiState.ReviewCard.Recall)?.copy(typed = intent.answer) ?: card
            }
            ReviewIntent.HintTapped -> hint()
            ReviewIntent.CheckTapped -> check()
            ReviewIntent.NextTapped -> next()
        }
    }

    private fun retry() {
        val isWaiting: Boolean = (_state.value as? ReviewUiState.Reviewing)?.isBusy == true
        if (!isWaiting) open()
    }

    private fun open() {
        reading?.cancel()
        _state.value = ReviewUiState.Loading
        reading = viewModelScope.launch {
            when (val answer: ReviewsReadResult = learning.reviews()) {
                ReviewsReadResult.Unreachable -> _state.value = ReviewUiState.Failed
                is ReviewsReadResult.Read -> present(measured(answer.reviews))
            }
        }
    }

    private fun readTown() {
        viewModelScope.launch { towns.read() }
    }

    private fun townChanged(town: TownSnapshot?) {
        when (val shown: ReviewUiState = _state.value) {
            is ReviewUiState.NothingDue -> _state.value = shown.copy(path = town?.pathAtTheEnd())
            is ReviewUiState.LessonReady -> _state.value = shown.copy(number = town?.shownNumberOf(shown.lesson))
            else -> Unit
        }
    }

    private fun present(reviews: DueReviews) {
        val baseline: List<LessonId> = arrival ?: reviews.readFirst.also { read: List<LessonId> -> arrival = read }
        val first: DueReview? = reviews.due.firstOrNull()
        val nextDueAt: Instant? = reviews.nextDueAt
        when {
            first != null && first.lesson in reviews.readFirst && first.lesson !in baseline ->
                _state.value = ReviewUiState.LessonReady(
                    lesson = first.lesson,
                    number = towns.town.value?.shownNumberOf(first.lesson),
                )
            first != null -> _state.value = ReviewUiState.Reviewing(
                walked = walked,
                dueCount = reviews.due.size,
                card = first.toCard(),
                step = ReviewUiState.ReviewStep.Answering,
            )
            nextDueAt == null -> _state.value = ReviewUiState.NoCards
            else -> reading = viewModelScope.launch { waitFor(nextDueAt) }
        }
    }

    private suspend fun waitFor(nextDueAt: Instant) {
        var remaining: Duration = countdownTo(finishesAt = nextDueAt, now = clock.now() + gap)
        while (remaining > Duration.ZERO) {
            _state.value = endAt(remaining, nextDueAt)
            delay(repaintDelay(remaining))
            remaining = countdownTo(finishesAt = nextDueAt, now = clock.now() + gap)
        }
        _state.value = endAt(Duration.ZERO, nextDueAt)
        var answer: ReviewsReadResult = learning.reviews()
        while (answer !is ReviewsReadResult.Read) {
            delay(repaintDelay(null))
            answer = learning.reviews()
        }
        present(measured(answer.reviews))
    }

    private fun endAt(remaining: Duration, nextDueAt: Instant): ReviewUiState.NothingDue = ReviewUiState.NothingDue(
        remaining = remaining,
        dueAt = nextDueAt - gap,
        path = towns.town.value?.pathAtTheEnd(),
    )

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
                    current.copy(card = recall.copy(hint = answer.hint), step = ReviewUiState.ReviewStep.Answering)
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
            is ReviewVerdict.Correct -> ReviewUiState.ReviewStep.Correct(skill = verdict.earnedSkill?.toSkillLine())
            is ReviewVerdict.Wrong -> ReviewUiState.ReviewStep.Wrong(correct = card.correctFormOf(verdict))
        }
        readTown()
        reread = (learning.reviews() as? ReviewsReadResult.Read)?.reviews?.let(::measured)
        stepTo(step)
    }

    private fun next() {
        val reviewing: ReviewUiState.Reviewing = _state.value as? ReviewUiState.Reviewing ?: return
        if (!reviewing.isRated) return
        walked += 1
        val reviews: DueReviews = reread ?: return open()
        reread = null
        present(reviews)
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
        gap = read.readAt - clock.now()
        return read
    }
}

private fun DueReview.toCard(): ReviewUiState.ReviewCard = when (this) {
    is DueReview.Recognition -> ReviewUiState.ReviewCard.Recognition(
        wordId = wordId,
        word = word,
        frame = frame,
        choices = choices,
        chosen = null,
    )
    is DueReview.Recall -> ReviewUiState.ReviewCard.Recall(
        wordId = wordId,
        gloss = gloss,
        gappedFrame = gappedFrame,
        typed = "",
        hint = null,
    )
}

private fun ReviewUiState.ReviewCard.sentAnswer(): String? = when (this) {
    is ReviewUiState.ReviewCard.Recognition -> chosen?.value
    is ReviewUiState.ReviewCard.Recall -> typed.ifEmpty { null }
}

private fun ReviewUiState.ReviewCard.correctFormOf(verdict: ReviewVerdict.Wrong): String = when (this) {
    is ReviewUiState.ReviewCard.Recognition -> verdict.gloss
    is ReviewUiState.ReviewCard.Recall -> verdict.word
}

private fun RaisedSkill.toSkillLine(): ReviewUiState.SkillLine = ReviewUiState.SkillLine(
    resource = resource,
    level = level,
    ratePercent = ratePercent,
    rates = ratesOf(ratePerHourBefore, ratePerHourAfter),
    words = words,
)

private fun ratesOf(before: Double?, after: Double?): ReviewUiState.SkillRates? {
    if (before == null || after == null) return null
    return ReviewUiState.SkillRates(before = floor(before).toLong(), after = floor(after).toLong())
}

private fun TownSnapshot.shownNumberOf(lesson: LessonId): Int? = numberOf(lesson).takeIf { number: Int -> number > 0 }

private fun TownSnapshot.pathAtTheEnd(): ReviewUiState.LessonPath? {
    val earned: Set<LessonId> = skills.map { skill: TownSnapshot.EarnedSkill -> skill.lesson }.toSet()
    val lesson: TownSnapshot.Lesson = lessons.firstOrNull { held: TownSnapshot.Lesson ->
        held.id !in earned && held.standings.any { standing: WordStanding -> standing != WordStanding.NotStarted }
    } ?: return null
    return ReviewUiState.LessonPath(number = numberOf(lesson.id), counts = schoolPathCountsOf(lesson.standings))
}
