package com.emm.mygame.feature.school

import com.emm.mygame.core.model.town.TownSnapshot
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Test

class SchoolLessonBlockTest {

    private val busySchool: TownSnapshot = townOf(
        lessons = listOf(lessonOf(), lessonOf(id = secondLesson)),
        lessonSlot = slotOf(),
    )

    private val nearlyFullLearning: TownSnapshot = townOf(
        lessons = listOf(lessonOf(wordCount = 6, enteringWordCount = 5)),
        learning = TownSnapshot.Learning(cap = 10, inLearning = 8, retainedWords = null, nextInLearningDueAt = null),
    )

    private fun blockOf(town: TownSnapshot, gap: Duration, index: Int): SchoolUiState.LessonBlock? {
        val content: SchoolUiState.Content =
            town.contentAt(now = readInstant + 30.seconds, gap = gap, requests = SchoolRequests.none, selected = null)
        return (content.lessons[index].state as? SchoolUiState.LessonState.Open)?.block
    }

    @Test
    fun `a busy slot's block carries when the slot frees`() {
        assertEquals(
            SchoolUiState.LessonBlock.SlotBusy(
                name = firstLessonName,
                remaining = 120.seconds,
                freesAt = Instant.parse("2026-11-05T10:02:25Z"),
            ),
            blockOf(busySchool, gap = 5.seconds, index = 1),
        )
    }

    @Test
    fun `a cap block carries how many more words learning must make room for`() {
        assertEquals(
            SchoolUiState.LessonBlock.CapReached(shortWords = 3),
            blockOf(nearlyFullLearning, gap = Duration.ZERO, index = 0),
        )
    }
}
