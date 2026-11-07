package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.numberOf
import com.emm.mygame.core.projection.countdownTo
import kotlin.time.Duration
import kotlin.time.Instant

internal data class LessonRead(val town: TownSnapshot, val readFirst: List<LessonId>) {

    fun nextFinishAfter(now: Instant): Instant? =
        town.lessonSlot?.finishesAt?.takeIf { finish: Instant -> finish > now }

    fun remainingOf(lesson: LessonId, now: Instant): Duration? = town.lessonSlot
        ?.takeIf { slot: TownSnapshot.LessonSlot -> slot.lesson == lesson }
        ?.let { slot: TownSnapshot.LessonSlot -> countdownTo(finishesAt = slot.finishesAt, now = now) }
        ?.takeIf { remaining: Duration -> remaining > Duration.ZERO }

    fun stateOf(walk: LessonWalk, wordIndex: Int, now: Instant): LessonWordsUiState {
        val lesson: TownSnapshot.Lesson = town.lessons.firstOrNull { candidate: TownSnapshot.Lesson ->
            candidate.id == walk.lesson
        } ?: return LessonWordsUiState.NothingToRead
        if (lesson.readings.isEmpty()) return LessonWordsUiState.NothingToRead
        val remaining: Duration? = remainingOf(walk.lesson, now)
        return LessonWordsUiState.Reading(
            number = town.numberOf(walk.lesson),
            theme = lesson.theme,
            words = lesson.readings,
            index = minOf(wordIndex, lesson.readings.lastIndex),
            remaining = remaining,
            wayOn = if (remaining == null) wayOnOf(readFirst, walk.opened) else null,
        )
    }
}

internal fun wayOnOf(readFirst: List<LessonId>, opened: List<LessonId>): LessonWordsUiState.WayOn {
    val next: LessonId = readFirst.firstOrNull { unread: LessonId -> unread !in opened }
        ?: return LessonWordsUiState.WayOn.Reviews
    return LessonWordsUiState.WayOn.Lesson(next)
}
