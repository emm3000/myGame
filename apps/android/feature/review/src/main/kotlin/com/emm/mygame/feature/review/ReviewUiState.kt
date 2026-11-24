package com.emm.mygame.feature.review

import com.emm.mygame.core.model.learning.FrameSpan
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.ReviewChoice
import com.emm.mygame.core.model.learning.ReviewHint
import com.emm.mygame.core.model.learning.ReviewRefusal
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.ChoiceId
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.school.SchoolPathCounts
import kotlin.time.Instant

sealed interface ReviewUiState {

    data object Loading : ReviewUiState

    data object Failed : ReviewUiState

    data object NoCards : ReviewUiState

    data class NothingDue(val dueAt: Instant, val path: LessonPath?) : ReviewUiState

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

        val openSpan: Int?

        data class Recognition(
            override val wordId: WordId,
            val word: String,
            val frame: List<FrameSpan>,
            val choices: List<ReviewChoice>,
            val chosen: ChoiceId?,
            override val openSpan: Int?,
        ) : ReviewCard {

            override val shownAnswer: String?
                get() = choices.firstOrNull { choice: ReviewChoice -> choice.id == chosen }?.gloss
        }

        data class Recall(
            override val wordId: WordId,
            val gloss: String,
            val gappedFrame: List<FrameSpan>,
            val typed: String,
            val hint: ReviewHint?,
            override val openSpan: Int?,
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

        data class Correct(val skill: SkillLine?, val openedLevel: Int?) : ReviewStep

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
