package com.emm.mygame.feature.fief

import com.emm.mygame.core.network.ChoiceId
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.ReviewChoice
import com.emm.mygame.core.network.ReviewHint
import com.emm.mygame.core.network.ReviewRefusal
import com.emm.mygame.core.network.SchoolPathCounts
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.WordId
import kotlin.time.Duration
import kotlin.time.Instant

sealed interface ReviewUiState {

    data object Loading : ReviewUiState

    data object Failed : ReviewUiState

    data object NoCards : ReviewUiState

    data class NothingDue(val remaining: Duration, val dueAt: Instant, val path: LessonPath?) : ReviewUiState

    data class LessonReady(val lesson: LessonId, val number: Int?) : ReviewUiState

    data class Reviewing(
        val walked: Int,
        val dueCount: Int,
        val card: ReviewCard,
        val step: ReviewStep,
        val isDealtFromStack: Boolean,
    ) : ReviewUiState {

        val isBusy: Boolean
            get() = step == ReviewStep.Checking || step == ReviewStep.Hinting

        val isRated: Boolean
            get() = step is ReviewStep.Correct || step is ReviewStep.Wrong
    }

    sealed interface ReviewCard {

        val wordId: WordId

        val shownAnswer: String?

        data class Recognition(
            override val wordId: WordId,
            val word: String,
            val frame: String,
            val choices: List<ReviewChoice>,
            val chosen: ChoiceId?,
        ) : ReviewCard {

            override val shownAnswer: String?
                get() = choices.firstOrNull { choice: ReviewChoice -> choice.id == chosen }?.gloss
        }

        data class Recall(
            override val wordId: WordId,
            val gloss: String,
            val gappedFrame: String,
            val typed: String,
            val hint: ReviewHint?,
        ) : ReviewCard {

            override val shownAnswer: String
                get() = typed
        }
    }

    sealed interface ReviewStep {

        data object Answering : ReviewStep

        data object Checking : ReviewStep

        data object Hinting : ReviewStep

        data object NearMiss : ReviewStep

        data class Refused(val refusal: ReviewRefusal) : ReviewStep

        data object Unreachable : ReviewStep

        data class Correct(val skill: SkillLine?) : ReviewStep

        data class Wrong(val correct: String) : ReviewStep
    }

    data class SkillLine(
        val resource: TownResourceKind,
        val level: Int,
        val ratePercent: Int,
        val rates: SkillRates?,
        val words: List<String>,
    )

    data class SkillRates(val before: Long, val after: Long)

    data class LessonPath(val number: Int, val counts: SchoolPathCounts)
}
