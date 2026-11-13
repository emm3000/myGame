package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.nameOf
import com.emm.mygame.core.network.nextStepCard
import com.emm.mygame.core.network.numberOf
import com.emm.mygame.core.network.schoolPathCountsOf
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.contentAt(
    now: Instant,
    gap: Duration,
    mutations: SchoolMutations,
    selected: LessonId?,
): SchoolUiState.Content {
    val card: NextStepCard = nextStepCard()
    return SchoolUiState.Content(
        schoolLevel = schoolLevel(),
        learning = learningLine(),
        slot = lessonSlot?.lineIn(this, now) ?: SchoolUiState.SlotLine.Idle,
        skills = skills.mapIndexed { index: Int, skill: TownSnapshot.EarnedSkill -> skill.lineAt(index, skills) },
        lessons = lessons.map { lesson: TownSnapshot.Lesson -> lesson.cardIn(this) },
        releasedLessons = releasedLessons.map { lesson: TownSnapshot.ReleasedLesson -> lesson.cardIn(this) },
        nextStep = card,
        nextStepTime = card.countdown?.timeAt(now, gap),
        start = mutations.start,
        stop = mutations.stop,
        selected = selected,
    )
}

internal fun TownSnapshot.nextChangeAfter(now: Instant): Instant? =
    listOfNotNull(work.slot?.finishesAt, lessonSlot?.finishesAt, seasonEndsAt, nextDueAt)
        .filter { instant: Instant -> instant > now }
        .minOrNull()

internal fun TownSnapshot.nearestCountdownAt(now: Instant): Duration? =
    listOfNotNull(lessonSlot?.finishesAt, nextDueAt)
        .filter { instant: Instant -> instant > now }
        .minOrNull()
        ?.let { instant: Instant -> instant - now }

private fun NextStepCard.Countdown.timeAt(now: Instant, gap: Duration): SchoolUiState.NextStepTime =
    SchoolUiState.NextStepTime(remaining = countdownTo(finishesAt = at, now = now), finishesAt = at - gap)

private fun TownSnapshot.schoolLevel(): Int =
    buildings.first { building: TownSnapshot.Building -> building.kind == TownBuildingKind.School }.level

private fun TownSnapshot.isPastCap(wordCount: Int): Boolean = learning.inLearning + wordCount > learning.cap

private fun TownSnapshot.learningLine(): SchoolUiState.LearningLine {
    val next: TownSnapshot.Lesson? = lessons.firstOrNull { lesson: TownSnapshot.Lesson ->
        !lesson.isStudied && lessonSlot?.lesson != lesson.id
    }
    return SchoolUiState.LearningLine(
        inLearning = learning.inLearning,
        cap = learning.cap,
        wordsPastCap = next?.wordCount?.takeIf(::isPastCap),
    )
}

private fun TownSnapshot.LessonSlot.lineIn(town: TownSnapshot, now: Instant): SchoolUiState.SlotLine {
    val remaining: Duration = countdownTo(finishesAt = finishesAt, now = now)
    val name: LessonName = town.nameOf(lesson)
    if (remaining == Duration.ZERO) return SchoolUiState.SlotLine.Done(lesson, name)
    return SchoolUiState.SlotLine.Busy(lesson, name, remaining, total = finishesAt - startedAt)
}

private fun TownSnapshot.EarnedSkill.lineAt(
    index: Int,
    skills: List<TownSnapshot.EarnedSkill>,
): SchoolUiState.SkillLine = SchoolUiState.SkillLine(
    lesson = lesson,
    resource = resource,
    level = skills.take(index + 1).count { earlier: TownSnapshot.EarnedSkill -> earlier.resource == resource },
    ratePercent = ratePercent,
)

private fun TownSnapshot.Lesson.cardIn(town: TownSnapshot): SchoolUiState.LessonCard = SchoolUiState.LessonCard(
    lesson = id,
    number = town.numberOf(id),
    theme = theme,
    wordCount = wordCount,
    resource = skill.resource,
    ratePercent = skill.ratePercent,
    duration = duration,
    path = schoolPathCountsOf(standings),
    state = town.lessonStateOf(id, isStudied, requiredSchoolLevel, wordCount),
)

private fun TownSnapshot.ReleasedLesson.cardIn(town: TownSnapshot): SchoolUiState.ReleasedLessonCard =
    SchoolUiState.ReleasedLessonCard(
        lesson = id,
        name = LessonName.Released(band, position),
        wordCount = wordCount,
        duration = duration,
        path = schoolPathCountsOf(standings),
        state = town.lessonStateOf(id, isStudied, requiredSchoolLevel, wordCount),
    )

private fun TownSnapshot.lessonStateOf(
    lesson: LessonId,
    isStudied: Boolean,
    requiredSchoolLevel: Int,
    wordCount: Int,
): SchoolUiState.LessonState = when {
    isStudied -> SchoolUiState.LessonState.Studied
    lessonSlot?.lesson == lesson -> SchoolUiState.LessonState.Studying
    else -> SchoolUiState.LessonState.Open(blockOf(requiredSchoolLevel, wordCount))
}

private fun TownSnapshot.blockOf(requiredSchoolLevel: Int, wordCount: Int): SchoolUiState.LessonBlock? {
    val running: TownSnapshot.LessonSlot? = lessonSlot
    return when {
        running != null -> SchoolUiState.LessonBlock.SlotBusy(nameOf(running.lesson))
        schoolLevel() < requiredSchoolLevel -> SchoolUiState.LessonBlock.SchoolTooLow(requiredSchoolLevel)
        isPastCap(wordCount) -> SchoolUiState.LessonBlock.CapReached(learning.inLearning, learning.cap, wordCount)
        else -> null
    }
}
