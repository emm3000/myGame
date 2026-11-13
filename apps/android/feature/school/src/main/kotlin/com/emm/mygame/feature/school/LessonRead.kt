package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.nameOf
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal data class LessonRead(val town: TownSnapshot, val readFirst: List<LessonId>?) {

    fun isDrawableWithoutReport(lesson: LessonId, now: Instant): Boolean =
        readingsOf(lesson).isEmpty() || remainingOf(lesson, now) != null

    fun nextFinishAfter(now: Instant): Instant? =
        town.lessonSlot?.finishesAt?.takeIf { finish: Instant -> finish > now }

    fun remainingOf(lesson: LessonId, now: Instant): Duration? = town.lessonSlot
        ?.takeIf { slot: TownSnapshot.LessonSlot -> slot.lesson == lesson }
        ?.let { slot: TownSnapshot.LessonSlot -> countdownTo(finishesAt = slot.finishesAt, now = now) }
        ?.takeIf { remaining: Duration -> remaining > Duration.ZERO }

    fun stateOf(
        walk: LessonWalk,
        wordIndex: Int,
        shownSupport: LessonWordsUiState.ShownSupport?,
        now: Instant,
    ): LessonWordsUiState {
        val readings: List<TownSnapshot.WordReading> = readingsOf(walk.lesson)
        if (readings.isEmpty()) return LessonWordsUiState.NothingToRead
        val remaining: Duration? = remainingOf(walk.lesson, now)
        return LessonWordsUiState.Reading(
            name = town.nameOf(walk.lesson),
            theme = shelvedOf(walk.lesson)?.theme,
            words = readings,
            index = minOf(wordIndex, readings.lastIndex),
            remaining = remaining,
            wayOn = if (remaining == null && readFirst != null) wayOnOf(readFirst, walk.opened) else null,
            shownSupport = shownSupport,
        )
    }

    private fun shelvedOf(lesson: LessonId): TownSnapshot.Lesson? =
        town.lessons.firstOrNull { candidate: TownSnapshot.Lesson -> candidate.id == lesson }

    private fun readingsOf(lesson: LessonId): List<TownSnapshot.WordReading> = shelvedOf(lesson)?.readings
        ?: town.releasedLessons.firstOrNull { candidate: TownSnapshot.ReleasedLesson -> candidate.id == lesson }
            ?.readings
            .orEmpty()
}

internal fun wayOnOf(readFirst: List<LessonId>, opened: List<LessonId>): LessonWordsUiState.WayOn {
    val next: LessonId = readFirst.firstOrNull { unread: LessonId -> unread !in opened }
        ?: return LessonWordsUiState.WayOn.Reviews
    return LessonWordsUiState.WayOn.Lesson(next)
}
