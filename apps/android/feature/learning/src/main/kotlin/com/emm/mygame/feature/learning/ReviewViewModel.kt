package com.emm.mygame.feature.learning

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.model.learning.DueReview
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.LearningRepository
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.RaisedSkill
import com.emm.mygame.core.model.learning.ReviewAnswerResult
import com.emm.mygame.core.model.learning.ReviewHint
import com.emm.mygame.core.model.learning.ReviewHintResult
import com.emm.mygame.core.model.learning.ReviewVerdict
import com.emm.mygame.core.model.learning.ReviewsReadResult
import com.emm.mygame.core.model.town.HeldTown
import com.emm.mygame.core.model.town.TownRepository
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.guidance.numberOf
import com.emm.mygame.core.model.town.school.WordStanding
import com.emm.mygame.core.model.town.school.schoolPathCountsOf
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.projection.repaintDelay
import kotlin.math.floor
import kotlin.time.Clock
import kotlin.time.Duration
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
    private val towns: TownRepository,
    private val clock: Clock,
) : ViewModel() {

    private val _state: MutableStateFlow<ReviewUiState> = MutableStateFlow(ReviewUiState.Loading)

    val state: StateFlow<ReviewUiState> = _state.asStateFlow()

    private val _effects: Channel<ReviewEffect> = Channel(Channel.BUFFERED)

    val effects: Flow<ReviewEffect> = _effects.receiveAsFlow()

    private var reading: Job? = null

    private var waiting: Job? = null

    private var reread: DueReviews? = null

    private var gap: Duration = Duration.ZERO

    private var walked: Int = 0

    private var arrival: List<LessonId>? = null

    private var isShown: Boolean = true

    init {
        viewModelScope.launch { towns.town.collect { held: HeldTown? -> townChanged(held?.town) } }
        readTown()
        open()
    }

    fun onIntent(intent: ReviewIntent) {
        when (intent) {
            ReviewIntent.ScreenShown -> show()
            ReviewIntent.ScreenHidden -> {
                isShown = false
                reading?.cancel()
                waiting?.cancel()
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
            ReviewIntent.ReviewsStartTapped -> {
                walked = 0
                open()
            }
        }
    }

    private fun show() {
        if (isShown) return
        isShown = true
        when (val shown: ReviewUiState = _state.value) {
            ReviewUiState.Loading -> open()
            is ReviewUiState.NothingDue -> waiting = viewModelScope.launch { waitFor(shown.dueAt + gap) }
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
        reading?.cancel()
        waiting?.cancel()
        _state.value = ReviewUiState.Loading
        reading = viewModelScope.launch {
            when (val answer: ReviewsReadResult = learning.reviews()) {
                ReviewsReadResult.Unreachable -> _state.value = ReviewUiState.Failed
                is ReviewsReadResult.Read -> present(measured(answer.reviews), isDealtFromStack = false)
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

    private fun present(reviews: DueReviews, isDealtFromStack: Boolean) {
        val baseline: List<LessonId> = arrival ?: reviews.readFirst.also { read: List<LessonId> -> arrival = read }
        val first: DueReview? = reviews.due.firstOrNull()
        val nextDueAt: Instant? = reviews.nextDueAt
        when {
            first != null && first.lesson in reviews.readFirst && first.lesson !in baseline ->
                _state.value = ReviewUiState.LessonReady(
                    lesson = first.lesson,
                    number = towns.town.value?.town?.shownNumberOf(first.lesson),
                )
            first != null -> _state.value = ReviewUiState.Reviewing(
                walked = walked,
                dueCount = reviews.due.size,
                card = first.toCard(),
                step = ReviewUiState.ReviewStep.Answering,
                isDealtFromStack = isDealtFromStack,
            )
            nextDueAt == null -> _state.value = ReviewUiState.NoCards
            else -> waiting = viewModelScope.launch { waitFor(nextDueAt) }
        }
    }

    private suspend fun waitFor(nextDueAt: Instant) {
        _state.value = endAt(nextDueAt)
        delay(countdownTo(finishesAt = nextDueAt, now = clock.now() + gap))
        var answer: ReviewsReadResult = learning.reviews()
        while (answer !is ReviewsReadResult.Read) {
            delay(repaintDelay(null))
            answer = learning.reviews()
        }
        present(measured(answer.reviews), isDealtFromStack = false)
    }

    private fun endAt(nextDueAt: Instant): ReviewUiState.NothingDue = ReviewUiState.NothingDue(
        dueAt = nextDueAt - gap,
        path = towns.town.value?.town?.pathAtTheEnd(),
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
                skill = verdict.earnedSkill?.toSkillLine(),
                openedLevel = verdict.openedLevel,
            )
            is ReviewVerdict.Wrong -> ReviewUiState.ReviewStep.Wrong(correct = card.correctFormOf(verdict))
        }
        _effects.send(ReviewEffect.Answered)
        reread = (learning.reviews() as? ReviewsReadResult.Read)?.reviews?.let(::measured)
        stepTo(step)
    }

    private fun next() {
        val reviewing: ReviewUiState.Reviewing = _state.value as? ReviewUiState.Reviewing ?: return
        if (!reviewing.isRated) return
        walked += 1
        val reviews: DueReviews = reread ?: return open()
        reread = null
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
        openSpan = null,
    )
    is DueReview.Recall -> ReviewUiState.ReviewCard.Recall(
        wordId = wordId,
        gloss = gloss,
        gappedFrame = gappedFrame,
        typed = "",
        hint = null,
        openSpan = null,
    )
}

private fun ReviewUiState.ReviewCard.withHint(hint: ReviewHint): ReviewUiState.ReviewCard = when (this) {
    is ReviewUiState.ReviewCard.Recognition -> this
    is ReviewUiState.ReviewCard.Recall -> copy(hint = hint)
}

private fun ReviewUiState.ReviewCard.withSupportTapped(spanIndex: Int): ReviewUiState.ReviewCard {
    val shown: Int? = if (openSpan == spanIndex) null else spanIndex
    return when (this) {
        is ReviewUiState.ReviewCard.Recognition -> copy(openSpan = shown)
        is ReviewUiState.ReviewCard.Recall -> copy(openSpan = shown)
    }
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
