package com.emm.mygame.feature.school

import com.emm.mygame.core.network.LessonId
import org.junit.Assert.assertEquals
import org.junit.Test

class WayOnTest {

    private val lessonOne: LessonId = LessonId("lesson-1")

    private val lessonTwo: LessonId = LessonId("lesson-2")

    private val lessonThree: LessonId = LessonId("lesson-3")

    private val unread: List<LessonId> = listOf(lessonOne, lessonTwo, lessonThree)

    @Test
    fun `walks every unread lesson in curriculum order and then the reviews`() {
        val walk: List<LessonWordsUiState.WayOn> = listOf(
            wayOnOf(unread, opened = listOf(lessonOne)),
            wayOnOf(unread, opened = listOf(lessonOne, lessonTwo)),
            wayOnOf(unread, opened = listOf(lessonOne, lessonTwo, lessonThree)),
        )

        assertEquals(
            listOf(
                LessonWordsUiState.WayOn.Lesson(lessonTwo),
                LessonWordsUiState.WayOn.Lesson(lessonThree),
                LessonWordsUiState.WayOn.Reviews,
            ),
            walk,
        )
    }

    @Test
    fun `reaches every unread lesson when entered out of order`() {
        val walk: List<LessonWordsUiState.WayOn> = listOf(
            wayOnOf(unread, opened = listOf(lessonTwo)),
            wayOnOf(unread, opened = listOf(lessonTwo, lessonOne)),
            wayOnOf(unread, opened = listOf(lessonTwo, lessonOne, lessonThree)),
        )

        assertEquals(
            listOf(
                LessonWordsUiState.WayOn.Lesson(lessonOne),
                LessonWordsUiState.WayOn.Lesson(lessonThree),
                LessonWordsUiState.WayOn.Reviews,
            ),
            walk,
        )
    }

    @Test
    fun `goes to the reviews when nothing is left to read first`() {
        assertEquals(LessonWordsUiState.WayOn.Reviews, wayOnOf(emptyList(), opened = listOf(lessonOne)))
    }
}
