package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.CorrectVerdict
import com.emm.mygame.core.network.generated.models.CorrectVerdictEarnedSkill
import com.emm.mygame.core.network.generated.models.RecallReview
import com.emm.mygame.core.network.generated.models.RecognitionReview
import com.emm.mygame.core.network.generated.models.RecognitionReviewChoicesInner
import com.emm.mygame.core.network.generated.models.Reviews
import com.emm.mygame.core.network.generated.models.DueReview as WireDueReview
import com.emm.mygame.core.network.generated.models.ReviewVerdict as WireReviewVerdict

internal fun Reviews.toDueReviews(): DueReviews = DueReviews(
    due = due.map { review: WireDueReview -> review.toDueReview() },
    readFirst = readFirst.map(::LessonId),
    nextDueAt = nextDueAt?.toKotlinInstant(),
    readAt = readAt.toKotlinInstant(),
)

private fun WireDueReview.toDueReview(): DueReview = when (this) {
    is WireDueReview.RecognitionWrapper -> value.toRecognition()
    is WireDueReview.RecallWrapper -> value.toRecall()
}

private fun RecognitionReview.toRecognition(): DueReview.Recognition = DueReview.Recognition(
    wordId = WordId(wordId),
    lesson = LessonId(lessonId),
    dueAt = dueAt.toKotlinInstant(),
    word = word,
    frame = frame.toFrameSpans(),
    choices = choices.map { choice: RecognitionReviewChoicesInner ->
        ReviewChoice(id = ChoiceId(choice.choiceId), gloss = choice.gloss)
    },
)

private fun RecallReview.toRecall(): DueReview.Recall = DueReview.Recall(
    wordId = WordId(wordId),
    lesson = LessonId(lessonId),
    dueAt = dueAt.toKotlinInstant(),
    gloss = gloss,
    gappedFrame = gappedFrame.toFrameSpans(),
)

internal fun WireReviewVerdict.toReviewVerdict(): ReviewVerdict = when (this) {
    is WireReviewVerdict.NearmissWrapper -> ReviewVerdict.NearMiss
    is WireReviewVerdict.CorrectWrapper -> value.toCorrect()
    is WireReviewVerdict.WrongWrapper ->
        ReviewVerdict.Wrong(word = value.word, gloss = value.gloss, dueAt = value.dueAt.toKotlinInstant())
}

private fun CorrectVerdict.toCorrect(): ReviewVerdict.Correct = ReviewVerdict.Correct(
    word = word,
    gloss = gloss,
    dueAt = dueAt.toKotlinInstant(),
    earnedSkill = earnedSkill?.toRaisedSkill(),
)

private fun CorrectVerdictEarnedSkill.toRaisedSkill(): RaisedSkill? {
    val kind: TownResourceKind = resource.toTownResourceKind() ?: return null
    return RaisedSkill(
        resource = kind,
        level = level,
        ratePercent = ratePercent,
        ratePerHourBefore = ratePerHourBefore,
        ratePerHourAfter = ratePerHourAfter,
        words = words,
    )
}

private fun CorrectVerdictEarnedSkill.Resource.toTownResourceKind(): TownResourceKind? = when (this) {
    CorrectVerdictEarnedSkill.Resource.money -> TownResourceKind.Money
    CorrectVerdictEarnedSkill.Resource.food -> TownResourceKind.Food
    CorrectVerdictEarnedSkill.Resource.power -> TownResourceKind.Power
    CorrectVerdictEarnedSkill.Resource.material -> TownResourceKind.Material
    CorrectVerdictEarnedSkill.Resource.unknown_default_open_api -> null
}
