package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorLessonWordsTest : NavigatorFixture() {

    @Test
    fun `opens a lesson's words above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Today, Destination.Town, firstWords), backStack)
    }

    @Test
    fun `opens a lesson's words above Today`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today)

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Today, firstWords), backStack)
    }

    @Test
    fun `opens a lesson's words above the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School, firstWords), backStack)
    }

    @Test
    fun `takes the place of the lesson it walks on from`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            firstWords,
        )

        Navigator(backStack, NavigationLinks()).openLesson(secondLesson, walked = listOf(firstLesson))

        assertEquals(listOf(Destination.Today, secondWords), backStack)
    }

    @Test
    fun `takes the place of the reviews that stopped at a finished lesson`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.School,
            Destination.Review,
        )

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School, firstWords), backStack)
    }

    @Test
    fun `opens no lesson while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Today), backStack)
    }

    @Test
    fun `opens the reviews in the place of a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            firstWords,
        )

        Navigator(backStack, NavigationLinks()).openReviews()

        assertEquals(listOf(Destination.Today, Destination.Review), backStack)
    }

    @Test
    fun `goes back to the school from a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            firstWords,
        )

        Navigator(backStack, NavigationLinks()).openTab(Tab.Learn)

        assertEquals(listOf(Destination.Today, Destination.School), backStack)
    }

    @Test
    fun `returns to the town from a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.School,
            firstWords,
        )

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }
}
