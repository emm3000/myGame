package com.emm.mygame.core.network

import com.emm.mygame.core.network.generated.models.TownOverviewLearning
import com.emm.mygame.core.network.generated.models.TownOverviewLessonSlot
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInner
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInnerSkill
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInnerWordsInner
import com.emm.mygame.core.network.generated.models.TownOverviewLessonsInnerWordsInnerReading
import com.emm.mygame.core.network.generated.models.TownOverviewSkillsInner
import kotlin.time.Duration.Companion.seconds

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
        readings = words.mapNotNull { word: TownOverviewLessonsInnerWordsInner -> word.reading?.toWordReading() },
    )
}

private fun TownOverviewLessonsInnerWordsInnerReading.toWordReading(): TownSnapshot.WordReading =
    TownSnapshot.WordReading(word = word, gloss = gloss, frame = frame)

internal fun TownOverviewSkillsInner.toEarnedSkill(): TownSnapshot.EarnedSkill? {
    val kind: TownResourceKind = resource.toTownResourceKind() ?: return null
    return TownSnapshot.EarnedSkill(LessonId(lessonId), kind, ratePercent)
}

internal fun TownOverviewLearning.toLearning(): TownSnapshot.Learning =
    TownSnapshot.Learning(cap = cap, inLearning = inLearning)

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
