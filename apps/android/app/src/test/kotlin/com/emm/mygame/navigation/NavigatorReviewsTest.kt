package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorReviewsTest : NavigatorFixture() {

    @Test
    fun `opens no Report from sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openReport()

        assertEquals(listOf<NavKey>(signIn), backStack)
    }

    @Test
    fun `opens the reviews above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack, NavigationLinks()).openReviews()

        assertEquals(listOf(Destination.Town, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews above the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openReviews()

        assertEquals(listOf(Destination.Town, Destination.Report, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews above the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openReviews()

        assertEquals(listOf(Destination.Town, Destination.School, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews once on a double tap`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())

        navigator.openReviews()
        navigator.openReviews()

        assertEquals(listOf(Destination.Town, Destination.Report, Destination.Review), backStack)
    }

    @Test
    fun `returns to the Report on back from the review`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, Destination.Review)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `returns to the school on back from a review opened there`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.School, Destination.Review)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `returns to the town on its tab from the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `returns to the town on its tab from a review`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, Destination.Review)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `leaves sign-in alone when the session ends on the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report, Destination.Review)

        Navigator(backStack, NavigationLinks()).signedOut(isSessionEnded = true)

        assertEquals(listOf<NavKey>(sessionEndedSignIn), backStack)
    }

    @Test
    fun `opens no Report while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openReport()

        assertEquals(listOf<NavKey>(Destination.Town), backStack)
    }

    @Test
    fun `opens no reviews while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openReviews()

        assertEquals(listOf(Destination.Town, Destination.Report), backStack)
    }
}
