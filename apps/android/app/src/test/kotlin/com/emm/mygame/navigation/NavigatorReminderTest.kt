package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorReminderTest : NavigatorFixture() {

    @Test
    fun `opens Today alone on a tap of a reminder`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.School,
            firstWords,
        )

        Navigator(backStack, NavigationLinks()).openReminder()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `opens Today alone once signed in after a tap of a reminder on sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.openReminder()

        navigator.signedIn()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `stays on sign-in on a tap of a reminder before signing in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openReminder()

        assertEquals(listOf<NavKey>(signIn), backStack)
    }

    @Test
    fun `opens no reminder screen while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openReminder()

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School), backStack)
    }
}
