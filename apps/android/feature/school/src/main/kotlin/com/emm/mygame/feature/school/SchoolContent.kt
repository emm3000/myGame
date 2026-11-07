package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.nextStepCard
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

internal fun TownSnapshot.numberOf(lesson: LessonId): Int =
    lessons.indexOfFirst { candidate: TownSnapshot.Lesson -> candidate.id == lesson } + 1

private fun TownSnapshot.isPastCap(lesson: TownSnapshot.Lesson): Boolean =
    learning.inLearning + lesson.wordCount > learning.cap

private fun TownSnapshot.learningLine(): SchoolUiState.LearningLine {
    val next: TownSnapshot.Lesson? = lessons.firstOrNull { lesson: TownSnapshot.Lesson ->
        !lesson.isStudied && lessonSlot?.lesson != lesson.id
    }
    return SchoolUiState.LearningLine(
        inLearning = learning.inLearning,
        cap = learning.cap,
        wordsPastCap = next?.takeIf(::isPastCap)?.wordCount,
    )
}

private fun TownSnapshot.LessonSlot.lineIn(town: TownSnapshot, now: Instant): SchoolUiState.SlotLine {
    val remaining: Duration = countdownTo(finishesAt = finishesAt, now = now)
    val number: Int = town.numberOf(lesson)
    if (remaining == Duration.ZERO) return SchoolUiState.SlotLine.Done(lesson, number)
    return SchoolUiState.SlotLine.Busy(lesson, number, remaining, total = finishesAt - startedAt)
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
    state = stateIn(town),
)

private fun TownSnapshot.Lesson.stateIn(town: TownSnapshot): SchoolUiState.LessonState = when {
    isStudied -> SchoolUiState.LessonState.Studied
    town.lessonSlot?.lesson == id -> SchoolUiState.LessonState.Studying
    else -> SchoolUiState.LessonState.Open(blockIn(town))
}

private fun TownSnapshot.Lesson.blockIn(town: TownSnapshot): SchoolUiState.LessonBlock? {
    val running: TownSnapshot.LessonSlot? = town.lessonSlot
    return when {
        running != null -> SchoolUiState.LessonBlock.SlotBusy(town.numberOf(running.lesson))
        town.schoolLevel() < requiredSchoolLevel -> SchoolUiState.LessonBlock.SchoolTooLow(requiredSchoolLevel)
        town.isPastCap(this) ->
            SchoolUiState.LessonBlock.CapReached(town.learning.inLearning, town.learning.cap, wordCount)
        else -> null
    }
}
