package com.emm.mygame.core.network.town.school

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.town.TownResourceKind
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.school.RetainedWords
import com.emm.mygame.core.model.town.school.TownLessonRefusal
import com.emm.mygame.core.model.town.school.TownLessonResult
import com.emm.mygame.core.model.town.school.WordStanding
import com.emm.mygame.core.network.generated.models.ApiError
import com.emm.mygame.core.network.generated.models.BareApiError
import com.emm.mygame.core.network.generated.models.TownOverview
import com.emm.mygame.core.network.generated.models.TownOverviewLearning
import com.emm.mygame.core.network.generated.models.TownOverviewLearningRetainedWords
import com.emm.mygame.core.network.generated.models.TownOverviewLessonSlot
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInner
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInnerSkill
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInnerWordsInner
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInnerWordsInnerReading
import com.emm.mygame.core.network.generated.models.TownOverviewReleasedLessonsInner
import com.emm.mygame.core.network.generated.models.TownOverviewSkillsInner
import com.emm.mygame.core.network.generated.models.TownOverviewTextsInner
import com.emm.mygame.core.network.learning.toFrameSpans
import com.emm.mygame.core.network.learning.toWordSupport
import com.emm.mygame.core.network.placement.toBand
import com.emm.mygame.core.network.platform.WireRefusal
import com.emm.mygame.core.network.platform.toKotlinInstant
import com.emm.mygame.core.network.platform.wireRefusal
import kotlin.time.Duration.Companion.seconds
import retrofit2.Response

internal fun TownOverviewLessonsInner.toLesson(): TownSnapshot.Lesson? {
    val resource: TownResourceKind = skill.resource.toTownResourceKind() ?: return null
    return TownSnapshot.Lesson(
        id = LessonId(id),
        theme = theme,
        duration = durationSeconds.seconds,
        requiredSchoolLevel = requiredSchoolLevel,
        skill = TownSnapshot.LessonSkill(resource, skill.ratePercent),
        isStudied = isStudied,
        wordCount = words.size,
        enteringWordCount = enteringWordCount,
        readings = words.mapNotNull { word: TownOverviewLessonsInnerWordsInner -> word.toWordReading() },
        standings = words.mapNotNull { word: TownOverviewLessonsInnerWordsInner -> word.standing.toWordStanding() },
    )
}

internal fun TownOverviewReleasedLessonsInner.toReleasedLesson(): TownSnapshot.ReleasedLesson? {
    val released: PlacementBand = band.toBand() ?: return null
    return TownSnapshot.ReleasedLesson(
        id = LessonId(id),
        band = released,
        position = position,
        duration = durationSeconds.seconds,
        requiredSchoolLevel = requiredSchoolLevel,
        isStudied = isStudied,
        wordCount = words.size,
        enteringWordCount = enteringWordCount,
        readings = words.mapNotNull { word: TownOverviewLessonsInnerWordsInner -> word.toWordReading() },
        standings = words.mapNotNull { word: TownOverviewLessonsInnerWordsInner -> word.standing.toWordStanding() },
    )
}

private fun TownOverviewLessonsInnerWordsInner.Standing.toWordStanding(): WordStanding? = when (this) {
    TownOverviewLessonsInnerWordsInner.Standing.notStarted -> WordStanding.NotStarted
    TownOverviewLessonsInnerWordsInner.Standing.recognize -> WordStanding.Recognize
    TownOverviewLessonsInnerWordsInner.Standing.recall -> WordStanding.Recall
    TownOverviewLessonsInnerWordsInner.Standing.hold -> WordStanding.Hold
    TownOverviewLessonsInnerWordsInner.Standing.retained -> WordStanding.Retained
    TownOverviewLessonsInnerWordsInner.Standing.unknown_default_open_api -> null
}

private fun TownOverviewLessonsInnerWordsInner.toWordReading(): TownSnapshot.WordReading? {
    val shown: TownOverviewLessonsInnerWordsInnerReading = reading ?: return null
    return TownSnapshot.WordReading(
        word = shown.word,
        frame = shown.frame.toFrameSpans(),
        support = support?.toWordSupport(),
    )
}

internal fun TownOverviewTextsInner.toTextTitle(): TownSnapshot.TextTitle =
    TownSnapshot.TextTitle(id = TextId(id), title = title)

internal fun TownOverviewSkillsInner.toEarnedSkill(): TownSnapshot.EarnedSkill? {
    val kind: TownResourceKind = resource.toTownResourceKind() ?: return null
    return TownSnapshot.EarnedSkill(LessonId(lessonId), kind, ratePercent)
}

internal fun TownOverviewLearning.toLearning(): TownSnapshot.Learning =
    TownSnapshot.Learning(
        cap = cap,
        inLearning = inLearning,
        retainedWords = retainedWords?.let { words: TownOverviewLearningRetainedWords ->
            RetainedWords(count = words.count, total = words.total)
        },
        nextInLearningDueAt = nextInLearningDueAt?.toKotlinInstant(),
    )

internal fun TownOverviewLessonSlot.toLessonSlot(): TownSnapshot.LessonSlot = TownSnapshot.LessonSlot(
    lesson = LessonId(lessonId),
    startedAt = startedAt.toKotlinInstant(),
    finishesAt = finishesAt.toKotlinInstant(),
)

private fun TownOverviewLessonsInnerSkill.Resource.toTownResourceKind(): TownResourceKind? = when (this) {
    TownOverviewLessonsInnerSkill.Resource.money -> TownResourceKind.Money
    TownOverviewLessonsInnerSkill.Resource.food -> TownResourceKind.Food
    TownOverviewLessonsInnerSkill.Resource.power -> TownResourceKind.Power
    TownOverviewLessonsInnerSkill.Resource.material -> TownResourceKind.Material
    TownOverviewLessonsInnerSkill.Resource.unknown_default_open_api -> null
}

private fun TownOverviewSkillsInner.Resource.toTownResourceKind(): TownResourceKind? = when (this) {
    TownOverviewSkillsInner.Resource.money -> TownResourceKind.Money
    TownOverviewSkillsInner.Resource.food -> TownResourceKind.Food
    TownOverviewSkillsInner.Resource.power -> TownResourceKind.Power
    TownOverviewSkillsInner.Resource.material -> TownResourceKind.Material
    TownOverviewSkillsInner.Resource.unknown_default_open_api -> null
}

internal fun lessonResultOf(response: Response<TownOverview>, snapshot: TownSnapshot?): TownLessonResult {
    if (response.isSuccessful) {
        return if (snapshot == null) TownLessonResult.Unreachable else TownLessonResult.Answered(snapshot)
    }
    val refusal: WireRefusal = response.wireRefusal() ?: return TownLessonResult.Unreachable
    return TownLessonResult.Refused(refusal.toLessonRefusal())
}

private val lessonRefusals: Map<BareApiError.Kind, TownLessonRefusal> = mapOf(
    BareApiError.Kind.StudySlotBusy to TownLessonRefusal.StudySlotBusy,
    BareApiError.Kind.LessonSchoolTooLow to TownLessonRefusal.LessonSchoolTooLow,
    BareApiError.Kind.LessonAlreadyStudied to TownLessonRefusal.LessonAlreadyStudied,
    BareApiError.Kind.LessonUnderStudy to TownLessonRefusal.LessonUnderStudy,
    BareApiError.Kind.LessonStudyNotFound to TownLessonRefusal.LessonStudyNotFound,
    BareApiError.Kind.TownNotFound to TownLessonRefusal.TownNotFound,
)

private fun WireRefusal.toLessonRefusal(): TownLessonRefusal = when (this) {
    is WireRefusal.Bare -> lessonRefusals[kind] ?: TownLessonRefusal.Unrecognized
    is WireRefusal.WithParams -> error.toLessonRefusal()
}

private fun ApiError.toLessonRefusal(): TownLessonRefusal = when (this) {
    is ApiError.LearningcapreachedWrapper ->
        TownLessonRefusal.LearningCapReached(cap = value.params.learningCap, inLearning = value.params.cardsInLearning)
    else -> TownLessonRefusal.Unrecognized
}
