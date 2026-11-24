package com.emm.mygame.feature.school

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.UNSCALED_PERCENT
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.capWaitsUntil
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.model.town.guidance.nextStepCard
import com.emm.mygame.core.model.town.guidance.numberOf
import com.emm.mygame.core.model.town.school.LessonName
import com.emm.mygame.core.model.town.school.nameOf
import com.emm.mygame.core.model.town.school.schoolPathCountsOf
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
    val lessonCards: List<SchoolUiState.LessonCard> = lessons.map { lesson: TownSnapshot.Lesson -> lesson.cardIn(this) }
    return SchoolUiState.Content(
        schoolLevel = schoolLevel(),
        learning = learningLineAt(now, gap, startable = lessonCards.nextOpenWith(selected)),
        slot = lessonSlot?.lineIn(this, now) ?: SchoolUiState.SlotLine.Idle,
        skills = skills.mapIndexed { index: Int, skill: TownSnapshot.EarnedSkill -> skill.lineAt(index, skills) },
        lessons = lessonCards,
        releasedLessons = releasedLessons.map { lesson: TownSnapshot.ReleasedLesson -> lesson.cardIn(this) },
        texts = texts.map(::textCardOf),
        studyMark = seasonInForce?.studyMark(),
        nextStep = card,
        start = mutations.start,
        stop = mutations.stop,
        isHoldoutNoteShown = hasBandStarted,
        bandLines = bandLines,
        selected = selected,
    )
}

private fun textCardOf(text: TownSnapshot.TextTitle): SchoolUiState.TextCard =
    SchoolUiState.TextCard(text = text.id, title = text.title)

private fun SeasonInForce.studyMark(): SchoolUiState.DurationMark? =
    SchoolUiState.DurationMark(kind, durationPercent.study).takeUnless { mark: SchoolUiState.DurationMark ->
        mark.percent == UNSCALED_PERCENT
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

private fun TownSnapshot.schoolLevel(): Int =
    buildings.first { building: TownSnapshot.Building -> building.kind == TownBuildingKind.School }.level

private fun TownSnapshot.isPastCap(enteringWordCount: Int): Boolean =
    learning.inLearning + enteringWordCount > learning.cap

private fun TownSnapshot.learningLineAt(
    now: Instant,
    gap: Duration,
    startable: SchoolUiState.LessonCard?,
): SchoolUiState.LearningLine = SchoolUiState.LearningLine(
    inLearning = learning.inLearning,
    cap = learning.cap,
    pastCapWords = startable?.enteringWordCount?.takeIf(::isPastCap),
    opening = capOpeningAt(now, gap),
)

private fun List<SchoolUiState.LessonCard>.nextOpenWith(selected: LessonId?): SchoolUiState.LessonCard? =
    featuredWith(selected)?.takeIf(::isOpen) ?: firstOrNull(::isOpen)

private fun isOpen(card: SchoolUiState.LessonCard): Boolean = card.state is SchoolUiState.LessonState.Open

private fun TownSnapshot.capOpeningAt(now: Instant, gap: Duration): SchoolUiState.CapOpening {
    val dueAt: Instant = capWaitsUntil(now) ?: return SchoolUiState.CapOpening.ReviewsDue
    return SchoolUiState.CapOpening.NextWordDue(remaining = dueAt - now, dueAt = dueAt - gap)
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

internal fun TownSnapshot.Lesson.cardIn(town: TownSnapshot): SchoolUiState.LessonCard = SchoolUiState.LessonCard(
    lesson = id,
    number = town.numberOf(id),
    theme = theme,
    wordCount = wordCount,
    enteringWordCount = enteringWordCount,
    resource = skill.resource,
    ratePercent = skill.ratePercent,
    duration = duration,
    path = schoolPathCountsOf(standings),
    state = town.lessonStateOf(id, isStudied, requiredSchoolLevel, enteringWordCount),
)

private fun TownSnapshot.ReleasedLesson.cardIn(town: TownSnapshot): SchoolUiState.ReleasedLessonCard =
    SchoolUiState.ReleasedLessonCard(
        lesson = id,
        name = LessonName.Released(band, position),
        wordCount = wordCount,
        duration = duration,
        path = schoolPathCountsOf(standings),
        state = town.lessonStateOf(id, isStudied, requiredSchoolLevel, enteringWordCount),
    )

private fun TownSnapshot.lessonStateOf(
    lesson: LessonId,
    isStudied: Boolean,
    requiredSchoolLevel: Int,
    enteringWordCount: Int,
): SchoolUiState.LessonState = when {
    isStudied -> SchoolUiState.LessonState.Studied
    lessonSlot?.lesson == lesson -> SchoolUiState.LessonState.Studying
    else -> SchoolUiState.LessonState.Open(blockOf(requiredSchoolLevel, enteringWordCount))
}

private fun TownSnapshot.blockOf(requiredSchoolLevel: Int, enteringWordCount: Int): SchoolUiState.LessonBlock? {
    val running: TownSnapshot.LessonSlot? = lessonSlot
    return when {
        running != null -> SchoolUiState.LessonBlock.SlotBusy(nameOf(running.lesson))
        schoolLevel() < requiredSchoolLevel -> SchoolUiState.LessonBlock.SchoolTooLow(requiredSchoolLevel)
        isPastCap(enteringWordCount) -> SchoolUiState.LessonBlock.CapReached
        else -> null
    }
}
