package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.feature.shell.bar.Tab
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Test

class NavigatorSessionTest : NavigatorFixture() {

    @Test
    fun `opens sign-up above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openSignUp()

        assertEquals(listOf(signIn, Destination.SignUp), backStack)
    }

    @Test
    fun `returns to sign-in on back from sign-up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `returns to the sign-in below when sign-up links to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack, NavigationLinks()).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens the reset request above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openForgotPassword()

        assertEquals(listOf(signIn, Destination.ForgotPassword), backStack)
    }

    @Test
    fun `returns to sign-in on back from the reset request`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.ForgotPassword)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `returns to the sign-in below when the reset request links to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.ForgotPassword)

        Navigator(backStack, NavigationLinks()).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens no reset request above sign-up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack, NavigationLinks()).openForgotPassword()

        assertEquals(listOf(signIn, Destination.SignUp), backStack)
    }

    @Test
    fun `leaves the last screen to the system on back`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens Today alone once signed up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack, NavigationLinks()).signedIn()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `opens Today alone once signed in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).signedIn()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `opens the school as the Learn tab`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openTab(Tab.Learn)

        assertEquals(listOf(Destination.Today, Destination.School), backStack)
    }

    @Test
    fun `keeps one school when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openTab(Tab.Learn)

        assertEquals(listOf(Destination.Today, Destination.School), backStack)
    }

    @Test
    fun `opens no school above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openTab(Tab.Learn)

        assertEquals(listOf<NavKey>(signIn), backStack)
    }

    @Test
    fun `stays on the school on a back gesture while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.back()

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `opens no school while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openTab(Tab.Learn)

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `returns to the town on back from the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `returns to the town below the school from the town tab`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `returns to sign-in alone once signed out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Map)

        Navigator(backStack, NavigationLinks()).signedOut(isSessionEnded = false)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `disables the tabs while signing out`() {
        val navigator: Navigator = Navigator(mutableListOf(Destination.Today, Destination.Town), NavigationLinks())

        navigator.signingOut()

        assertFalse(navigator.areLinksEnabled)
    }

    @Test
    fun `enables the tabs again for the next session`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()
        navigator.signedOut(isSessionEnded = false)

        navigator.signedIn()
        navigator.openTab(Tab.Learn)

        assertEquals(true to listOf(Destination.Today, Destination.School), navigator.areLinksEnabled to backStack)
    }

    @Test
    fun `leaves sign-in alone with the session-ended line when the session ends above the town`() = runTest {
        val signedInStacks: List<MutableList<NavKey>> = listOf(
            mutableListOf(Destination.Today, Destination.Town),
            mutableListOf(Destination.Today, Destination.Town),
            mutableListOf(Destination.Today, Destination.Town, Destination.Map),
            mutableListOf(Destination.Today, Destination.Town, Destination.School),
        )

        signedInStacks.forEach { backStack: MutableList<NavKey> ->
            Navigator(backStack, NavigationLinks()).followSessionEnds(flowOf(Unit))

            assertEquals(listOf(sessionEndedSignIn), backStack)
        }
    }

    @Test
    fun `shows the session-ended line when the session ends on a plain sign-in`() = runTest {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).followSessionEnds(flowOf(Unit))

        assertEquals(listOf(sessionEndedSignIn), backStack)
    }

    @Test
    fun `keeps the sign-in it shows when the session ends again`() = runTest {
        val shown: Destination.SignIn = Destination.SignIn(isSessionEnded = true)
        val backStack: MutableList<NavKey> = mutableListOf(shown)

        Navigator(backStack, NavigationLinks()).followSessionEnds(flowOf(Unit, Unit))

        assertSame(shown, backStack.single())
    }
}
