package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorLessonWordsTest : NavigatorFixture() {

    @Test
    fun `opens a lesson's words above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, firstWords), backStack)
    }

    @Test
    fun `opens a lesson's words above the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, Destination.Report, firstWords), backStack)
    }

    @Test
    fun `opens a lesson's words above the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, Destination.School, firstWords), backStack)
    }

    @Test
    fun `takes the place of the lesson it walks on from`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, firstWords)

        Navigator(backStack, NavigationLinks()).openLesson(secondLesson, walked = listOf(firstLesson))

        assertEquals(listOf(Destination.Town, Destination.Report, secondWords), backStack)
    }

    @Test
    fun `takes the place of the reviews that stopped at a finished lesson`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, Destination.Review)

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, Destination.School, firstWords), backStack)
    }

    @Test
    fun `opens no lesson while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `opens the reviews above a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, firstWords)

        Navigator(backStack, NavigationLinks()).openReviews()

        assertEquals(listOf(Destination.Town, Destination.Report, firstWords, Destination.Review), backStack)
    }

    @Test
    fun `goes back to the school from a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, firstWords)

        Navigator(backStack, NavigationLinks()).openSchool()

        assertEquals(listOf(Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `returns to the town from a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, firstWords)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `opens the Report tab from a lesson's words`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, firstWords)

        Navigator(backStack, NavigationLinks()).openReport()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }
}
