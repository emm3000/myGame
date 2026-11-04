package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.CorrectVerdict
import com.emm.mygame.core.network.generated.models.CorrectVerdictEarnedSkill
import com.emm.mygame.core.network.generated.models.FiefOverviewLessonsInner
import com.emm.mygame.core.network.generated.models.FiefOverviewReviews
import com.emm.mygame.core.network.generated.models.FiefOverviewSkillsInner
import com.emm.mygame.core.network.generated.models.RecallReview
import com.emm.mygame.core.network.generated.models.RecognitionReview
import com.emm.mygame.core.network.generated.models.RecognitionReviewChoicesInner
import com.emm.mygame.core.network.generated.models.DueReview as WireDueReview
import com.emm.mygame.core.network.generated.models.ReviewVerdict as WireReviewVerdict

internal fun FiefOverviewLessonsInner.toLessonState(): LessonState =
    LessonState(id = LessonId(id), theme = theme, isStudied = isStudied, wordCount = words.size)

internal fun List<FiefOverviewSkillsInner>.toEarnedSkills(): List<EarnedSkill> =
    mapNotNull { skill: FiefOverviewSkillsInner -> skill.toEarnedSkill() }

private fun FiefOverviewSkillsInner.toEarnedSkill(): EarnedSkill? {
    val kind: ResourceKind = resource.toResourceKind() ?: return null
    return EarnedSkill(lesson = LessonId(lessonId), resource = kind, ratePercent = ratePercent)
}

internal fun FiefOverviewReviews.toDueReviews(): DueReviews = DueReviews(
    due = due.map { review: WireDueReview -> review.toDueReview() },
    nextDueAt = nextDueAt?.toKotlinInstant(),
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
    frame = frame,
    choices = choices.map { choice: RecognitionReviewChoicesInner ->
        ReviewChoice(id = ChoiceId(choice.choiceId), gloss = choice.gloss)
    },
)

private fun RecallReview.toRecall(): DueReview.Recall = DueReview.Recall(
    wordId = WordId(wordId),
    lesson = LessonId(lessonId),
    dueAt = dueAt.toKotlinInstant(),
    gloss = gloss,
    gappedFrame = gappedFrame,
)

internal fun WireReviewVerdict.toReviewVerdict(): ReviewVerdict? = when (this) {
    is WireReviewVerdict.NearmissWrapper -> ReviewVerdict.NearMiss
    is WireReviewVerdict.CorrectWrapper -> value.toCorrect()
    is WireReviewVerdict.WrongWrapper ->
        ReviewVerdict.Wrong(word = value.word, gloss = value.gloss, dueAt = value.dueAt.toKotlinInstant())
}

private fun CorrectVerdict.toCorrect(): ReviewVerdict? {
    val skill: CorrectVerdictEarnedSkill? = earnedSkill
    val earned: EarnedSkill? = skill?.let { raised: CorrectVerdictEarnedSkill -> raised.toEarnedSkill() ?: return null }
    return ReviewVerdict.Correct(word = word, gloss = gloss, dueAt = dueAt.toKotlinInstant(), earnedSkill = earned)
}

private fun CorrectVerdictEarnedSkill.toEarnedSkill(): EarnedSkill? {
    val kind: ResourceKind = resource.toResourceKind() ?: return null
    return EarnedSkill(lesson = LessonId(lessonId), resource = kind, ratePercent = ratePercent)
}

private fun FiefOverviewSkillsInner.Resource.toResourceKind(): ResourceKind? = when (this) {
    FiefOverviewSkillsInner.Resource.wood -> ResourceKind.Wood
    FiefOverviewSkillsInner.Resource.stone -> ResourceKind.Stone
    FiefOverviewSkillsInner.Resource.iron -> ResourceKind.Iron
    FiefOverviewSkillsInner.Resource.gold -> ResourceKind.Gold
    FiefOverviewSkillsInner.Resource.food -> ResourceKind.Food
    FiefOverviewSkillsInner.Resource.unknown_default_open_api -> null
}

private fun CorrectVerdictEarnedSkill.Resource.toResourceKind(): ResourceKind? = when (this) {
    CorrectVerdictEarnedSkill.Resource.wood -> ResourceKind.Wood
    CorrectVerdictEarnedSkill.Resource.stone -> ResourceKind.Stone
    CorrectVerdictEarnedSkill.Resource.iron -> ResourceKind.Iron
    CorrectVerdictEarnedSkill.Resource.gold -> ResourceKind.Gold
    CorrectVerdictEarnedSkill.Resource.food -> ResourceKind.Food
    CorrectVerdictEarnedSkill.Resource.unknown_default_open_api -> null
}
