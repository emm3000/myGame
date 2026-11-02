package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorTest {

    @Test
    fun `opens sign-up above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.SignIn)

        Navigator(backStack).openSignUp()

        assertEquals(listOf(Destination.SignIn, Destination.SignUp), backStack)
    }

    @Test
    fun `returns to sign-in on back from sign-up`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.SignIn, Destination.SignUp)

        Navigator(backStack).back()

        assertEquals(listOf(Destination.SignIn), backStack)
    }

    @Test
    fun `returns to the sign-in below when sign-up links to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.SignIn, Destination.SignUp)

        Navigator(backStack).openSignIn()

        assertEquals(listOf(Destination.SignIn), backStack)
    }

    @Test
    fun `leaves the last screen to the system on back`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.SignIn)

        Navigator(backStack).back()

        assertEquals(listOf(Destination.SignIn), backStack)
    }

    @Test
    fun `opens the fief alone once signed up`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.SignIn, Destination.SignUp)

        Navigator(backStack).signedIn()

        assertEquals(listOf(Destination.Fief), backStack)
    }

    @Test
    fun `opens the chronicle above the fief`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Fief)

        Navigator(backStack).openChronicle()

        assertEquals(listOf(Destination.Fief, Destination.Chronicle), backStack)
    }

    @Test
    fun `keeps one chronicle when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Fief, Destination.Chronicle)

        Navigator(backStack).openChronicle()

        assertEquals(listOf(Destination.Fief, Destination.Chronicle), backStack)
    }

    @Test
    fun `returns to the fief below the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Fief, Destination.Chronicle)

        Navigator(backStack).openFief()

        assertEquals(listOf(Destination.Fief), backStack)
    }

    @Test
    fun `returns to sign-in alone once signed out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Fief, Destination.Chronicle)

        Navigator(backStack).signedOut()

        assertEquals(listOf(Destination.SignIn), backStack)
    }
}
