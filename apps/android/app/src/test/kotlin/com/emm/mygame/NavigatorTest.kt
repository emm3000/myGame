package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.FiefId
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Test

class NavigatorTest {

    private val signIn: Destination.SignIn = Destination.SignIn(isSessionEnded = false)

    private val sessionEndedSignIn: Destination.SignIn = Destination.SignIn(isSessionEnded = true)

    private val firstListed: FiefId = FiefId("509eadd5-6b34-4ea3-8e91-2b38744bd385")

    private val secondFief: FiefId = FiefId("7c1f0a52-3d4e-4b8a-9f61-2e5d8c0b4a17")

    private val map: Destination.Map = Destination.Map(firstListed)

    private val chronicle: Destination.Chronicle = Destination.Chronicle(firstListed)

    @Test
    fun `opens sign-up above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).openSignUp()

        assertEquals(listOf(signIn, Destination.SignUp), backStack)
    }

    @Test
    fun `returns to sign-in on back from sign-up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `returns to the sign-in below when sign-up links to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens the reset request above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).openForgotPassword()

        assertEquals(listOf(signIn, Destination.ForgotPassword), backStack)
    }

    @Test
    fun `returns to sign-in on back from the reset request`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.ForgotPassword)

        Navigator(backStack).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `returns to the sign-in below when the reset request links to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.ForgotPassword)

        Navigator(backStack).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens no reset request above sign-up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).openForgotPassword()

        assertEquals(listOf(signIn, Destination.SignUp), backStack)
    }

    @Test
    fun `leaves the last screen to the system on back`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens the town alone once signed up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).signedIn()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `opens the town alone once signed in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).signedIn()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `opens the chronicle above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openChronicle(firstListed)

        assertEquals(listOf(Destination.Town, chronicle), backStack)
    }

    @Test
    fun `keeps one chronicle when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).openChronicle(firstListed)

        assertEquals(listOf(Destination.Town, chronicle), backStack)
    }

    @Test
    fun `returns to the town below the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).openTown()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `returns to sign-in alone once signed out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).signedOut(isSessionEnded = false)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens the map above the town and pops back to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack)

        navigator.openMap(firstListed)
        assertEquals(listOf(Destination.Town, map), backStack)
        navigator.openTown()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `keeps one map when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).openMap(firstListed)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `returns to the town on back from the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).back()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `opens the map in place of the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).openMap(firstListed)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `opens the chronicle in place of the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).openChronicle(firstListed)

        assertEquals(listOf(Destination.Town, chronicle), backStack)
    }

    @Test
    fun `returns to the town on back from the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).back()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `leaves the back stack unchanged when the map or the chronicle is tapped while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack)

        navigator.signingOut()
        navigator.openMap(firstListed)
        navigator.openChronicle(firstListed)

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `disables the tabs while signing out`() {
        val navigator: Navigator = Navigator(mutableListOf(Destination.Town))

        navigator.signingOut()

        assertFalse(navigator.areTabsEnabled)
    }

    @Test
    fun `enables the tabs again for the next session`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()
        navigator.signedOut(isSessionEnded = false)

        navigator.signedIn()
        navigator.openMap(firstListed)

        assertEquals(true to listOf(Destination.Town, map), navigator.areTabsEnabled to backStack)
    }

    @Test
    fun `returns to sign-in alone once signed out from the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).signedOut(isSessionEnded = false)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `leaves sign-in alone with the session-ended line when the session ends above the town`() = runTest {
        val signedInStacks: List<MutableList<NavKey>> = listOf(
            mutableListOf(Destination.Town),
            mutableListOf(Destination.Town),
            mutableListOf(Destination.Town, map),
            mutableListOf(Destination.Town, chronicle),
        )

        signedInStacks.forEach { backStack: MutableList<NavKey> ->
            Navigator(backStack).followSessionEnds(flowOf(Unit))

            assertEquals(listOf(sessionEndedSignIn), backStack)
        }
    }

    @Test
    fun `shows the session-ended line when the session ends on a plain sign-in`() = runTest {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).followSessionEnds(flowOf(Unit))

        assertEquals(listOf(sessionEndedSignIn), backStack)
    }

    @Test
    fun `keeps the sign-in it shows when the session ends again`() = runTest {
        val shown: Destination.SignIn = Destination.SignIn(isSessionEnded = true)
        val backStack: MutableList<NavKey> = mutableListOf(shown)

        Navigator(backStack).followSessionEnds(flowOf(Unit, Unit))

        assertSame(shown, backStack.single())
    }

    @Test
    fun `keeps the map on screen when another fief is chosen, with the town below it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).switchFief(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Map(secondFief)), backStack)
    }

    @Test
    fun `keeps the chronicle on screen when another fief is chosen, with the town below it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, chronicle)

        Navigator(backStack).switchFief(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Chronicle(secondFief)), backStack)
    }

    @Test
    fun `keeps the screen it shows when the fief on screen is chosen`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)

        Navigator(backStack).switchFief(firstListed)

        assertSame(map, backStack.last())
    }

    @Test
    fun `opens no other fief while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, map)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()

        navigator.switchFief(secondFief)

        assertEquals(listOf(Destination.Town, map), backStack)
    }

    @Test
    fun `opens the map of the fief the tab names`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openMap(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Map(secondFief)), backStack)
    }

    @Test
    fun `opens the chronicle of the fief the tab names`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openChronicle(secondFief)

        assertEquals(listOf(Destination.Town, Destination.Chronicle(secondFief)), backStack)
    }

    @Test
    fun `opens no tab above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)
        val navigator: Navigator = Navigator(backStack)

        navigator.openMap(firstListed)
        navigator.openChronicle(firstListed)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `stays on the town when the town tab is tapped`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).openTown()

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `opens no other fief above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town)

        Navigator(backStack).switchFief(secondFief)

        assertEquals(listOf(Destination.Town), backStack)
    }

    @Test
    fun `never navigates to the fief`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)
        val navigator: Navigator = Navigator(backStack)
        val visited: MutableSet<NavKey> = mutableSetOf()

        listOf(
            navigator::signedIn,
            { navigator.openMap(firstListed) },
            { navigator.switchFief(secondFief) },
            { navigator.openChronicle(secondFief) },
            navigator::openTown,
            navigator::back,
        ).forEach { step: () -> Unit ->
            step()
            visited += backStack
        }

        assertEquals(
            setOf(
                Destination.Town,
                Destination.Map(firstListed),
                Destination.Map(secondFief),
                Destination.Chronicle(secondFief),
            ),
            visited,
        )
    }
}
