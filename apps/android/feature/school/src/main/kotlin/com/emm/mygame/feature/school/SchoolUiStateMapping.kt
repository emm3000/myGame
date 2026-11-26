package com.emm.mygame.feature.school

import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.town.LessonName
import com.emm.mygame.core.model.town.SeasonInForce
import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.UNSCALED_PERCENT
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.capWaitsUntil
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.model.town.guidance.nextStepCard
import com.emm.mygame.core.model.town.guidance.numberOf
import com.emm.mygame.core.model.town.nameOf
import com.emm.mygame.core.model.town.school.schoolPathCountsOf
import com.emm.mygame.core.projection.countdownTo
import com.emm.mygame.core.ui.DurationMark
import kotlin.time.Duration
import kotlin.time.Instant

internal fun TownSnapshot.contentAt(
    now: Instant,
    gap: Duration,
    requests: SchoolRequests,
    selected: LessonId?,
): SchoolUiState.Content {
    val card: NextStepCard = nextStepCard()
    val busy: SchoolUiState.LessonBlock.SlotBusy? = slotBusyAt(now, gap)
    val lessonCards: List<SchoolUiState.LessonCard> =
        lessons.map { lesson: TownSnapshot.Lesson -> lesson.cardIn(this, busy) }
    return SchoolUiState.Content(
        learning = learningLineAt(now, gap, startable = lessonCards.nextOpenWith(selected)),
        slot = lessonSlot?.lineIn(this, now) ?: SchoolUiState.SlotLine.Idle,
        skills = skills.mapIndexed { index: Int, skill: TownSnapshot.EarnedSkill -> skill.lineAt(index, skills) },
        lessons = lessonCards,
        releasedLessons = releasedLessons.map { lesson: TownSnapshot.ReleasedLesson -> lesson.cardIn(this, busy) },
        texts = texts.map(::textCardOf),
        studyMark = seasonInForce?.studyMark(),
        nextStep = card,
        start = requests.start,
        stop = requests.stop,
        isHoldoutNoteShown = hasBandStarted,
        bandLines = bandLines,
        selected = selected,
    )
}

private fun textCardOf(text: TownSnapshot.TextTitle): SchoolUiState.TextCard =
    SchoolUiState.TextCard(text = text.id, title = text.title)

private fun SeasonInForce.studyMark(): DurationMark? =
    DurationMark(kind, durationPercent.study).takeUnless { mark: DurationMark ->
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

private fun TownSnapshot.wordsPastCapWith(enteringWordCount: Int): Int =
    learning.inLearning + enteringWordCount - learning.cap

private fun TownSnapshot.isPastCap(enteringWordCount: Int): Boolean = wordsPastCapWith(enteringWordCount) > 0

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

internal fun TownSnapshot.slotBusyAt(now: Instant, gap: Duration): SchoolUiState.LessonBlock.SlotBusy? {
    val running: TownSnapshot.LessonSlot = lessonSlot ?: return null
    return SchoolUiState.LessonBlock.SlotBusy(
        name = nameOf(running.lesson),
        remaining = countdownTo(finishesAt = running.finishesAt, now = now),
        freesAt = running.finishesAt - gap,
    )
}

internal fun TownSnapshot.Lesson.cardIn(
    town: TownSnapshot,
    busy: SchoolUiState.LessonBlock.SlotBusy?,
): SchoolUiState.LessonCard = SchoolUiState.LessonCard(
    lesson = id,
    number = town.numberOf(id),
    theme = theme,
    wordCount = wordCount,
    enteringWordCount = enteringWordCount,
    resource = skill.resource,
    ratePercent = skill.ratePercent,
    duration = duration,
    path = schoolPathCountsOf(standings),
    state = town.lessonStateOf(id, isStudied, requiredSchoolLevel, enteringWordCount, busy),
)

private fun TownSnapshot.ReleasedLesson.cardIn(
    town: TownSnapshot,
    busy: SchoolUiState.LessonBlock.SlotBusy?,
): SchoolUiState.ReleasedLessonCard =
    SchoolUiState.ReleasedLessonCard(
        lesson = id,
        name = LessonName.Released(band, position),
        wordCount = wordCount,
        duration = duration,
        path = schoolPathCountsOf(standings),
        state = town.lessonStateOf(id, isStudied, requiredSchoolLevel, enteringWordCount, busy),
    )

private fun TownSnapshot.lessonStateOf(
    lesson: LessonId,
    isStudied: Boolean,
    requiredSchoolLevel: Int,
    enteringWordCount: Int,
    busy: SchoolUiState.LessonBlock.SlotBusy?,
): SchoolUiState.LessonState = when {
    isStudied -> SchoolUiState.LessonState.Studied
    lessonSlot?.lesson == lesson -> SchoolUiState.LessonState.Studying
    else -> SchoolUiState.LessonState.Open(busy ?: blockOf(requiredSchoolLevel, enteringWordCount))
}

private fun TownSnapshot.blockOf(
    requiredSchoolLevel: Int,
    enteringWordCount: Int,
): SchoolUiState.LessonBlock? = when {
    schoolLevel() < requiredSchoolLevel -> SchoolUiState.LessonBlock.SchoolTooLow(requiredSchoolLevel)
    isPastCap(enteringWordCount) ->
        SchoolUiState.LessonBlock.CapReached(shortWords = wordsPastCapWith(enteringWordCount))
    else -> null
}
