package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import com.emm.mygame.core.projection.StudyReminderLine
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorReminderAndDockTest : NavigatorFixture() {

    @Test
    fun `opens the Report above Today on a tap of the words reminder`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School, firstWords)

        Navigator(backStack, NavigationLinks()).openReminder(StudyReminderLine.Cards)

        assertEquals(listOf(Destination.Today, Destination.Report), backStack)
    }

    @Test
    fun `returns to Today on a tap of the check or the lesson reminder`() {
        listOf(StudyReminderLine.Check, StudyReminderLine.Lesson).forEach { line: StudyReminderLine ->
            val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Report, Destination.News)

            Navigator(backStack, NavigationLinks()).openReminder(line)

            assertEquals(listOf<NavKey>(Destination.Today), backStack)
        }
    }

    @Test
    fun `opens the Report once signed in after a tap of the words reminder on sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.openReminder(StudyReminderLine.Cards)

        navigator.signedIn()

        assertEquals(listOf(Destination.Today, Destination.Report), backStack)
    }

    @Test
    fun `keeps a tap of the words reminder on sign-in for the navigator a rotation rebuilds`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)
        val links: NavigationLinks = NavigationLinks()
        Navigator(backStack, links).openReminder(StudyReminderLine.Cards)

        Navigator(backStack, links).signedIn()

        assertEquals(listOf(Destination.Today, Destination.Report), backStack)
    }

    @Test
    fun `drops a tap of a reminder on sign-in once signed out`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.openReminder(StudyReminderLine.Cards)
        navigator.signedOut(isSessionEnded = true)

        navigator.signedIn()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `stays on sign-in on a tap of a reminder before signing in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openReminder(StudyReminderLine.Cards)

        assertEquals(listOf<NavKey>(signIn), backStack)
    }

    @Test
    fun `opens no reminder screen while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openReminder(StudyReminderLine.Cards)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `opens a dock move above the Report it was made from`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openFromDock { openReviews() }

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report, Destination.Review), backStack)
    }

    @Test
    fun `opens a dock move through the town from a screen that cannot open it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Map)

        Navigator(backStack, NavigationLinks()).openFromDock { openReviews() }

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Review), backStack)
    }

    @Test
    fun `makes no dock move while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Map)
        val navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openFromDock { openReviews() }

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Map), backStack)
    }

    @Test
    fun `leaves the screen alone on a town door tap while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Map)
        val navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openFromDock { openTown() }

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Map), backStack)
    }
}
