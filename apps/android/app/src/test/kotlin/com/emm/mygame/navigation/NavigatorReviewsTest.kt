package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorReviewsTest : NavigatorFixture() {

    @Test
    fun `opens the reviews above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openReviews()

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews above Today`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today)

        Navigator(backStack, NavigationLinks()).openReviews()

        assertEquals(listOf(Destination.Today, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews above the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openReviews()

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School, Destination.Review), backStack)
    }

    @Test
    fun `opens the reviews once on a double tap`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())

        navigator.openReviews()
        navigator.openReviews()

        assertEquals(listOf(Destination.Today, Destination.Review), backStack)
    }

    @Test
    fun `returns to Today on back from the review`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Review,
        )

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Today), backStack)
    }

    @Test
    fun `returns to the school on back from a review opened there`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.School,
            Destination.Review,
        )

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `returns to the town on its tab from a review`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Review,
        )

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `leaves sign-in alone when the session ends on a review`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Review,
        )

        Navigator(backStack, NavigationLinks()).signedOut(isSessionEnded = true)

        assertEquals(listOf<NavKey>(sessionEndedSignIn), backStack)
    }

    @Test
    fun `opens no reviews while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openReviews()

        assertEquals(listOf(Destination.Today), backStack)
    }
}
