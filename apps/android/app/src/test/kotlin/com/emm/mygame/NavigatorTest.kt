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

    private val fief: Destination.Fief = Destination.Fief(firstListed)

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
    fun `leaves the last screen to the system on back`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).back()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `lists the fiefs alone once signed up`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, Destination.SignUp)

        Navigator(backStack).signedIn()

        assertEquals(listOf(Destination.FirstFief), backStack)
    }

    @Test
    fun `lists the fiefs alone once signed in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack).signedIn()

        assertEquals(listOf(Destination.FirstFief), backStack)
    }

    @Test
    fun `opens the first listed fief alone`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.FirstFief)

        Navigator(backStack).firstFiefOpened(firstListed)

        assertEquals(listOf(fief), backStack)
    }

    @Test
    fun `ignores a listed fief once the list has left the screen`() {
        val backStack: MutableList<NavKey> = mutableListOf(sessionEndedSignIn)

        Navigator(backStack).firstFiefOpened(firstListed)

        assertEquals(listOf(sessionEndedSignIn), backStack)
    }

    @Test
    fun `opens the map of the fief it shows`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Fief(secondFief))

        Navigator(backStack).openMap()

        assertEquals(Destination.Map(secondFief), backStack.last())
    }

    @Test
    fun `opens the chronicle of the fief it shows`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Fief(secondFief))

        Navigator(backStack).openChronicle()

        assertEquals(Destination.Chronicle(secondFief), backStack.last())
    }

    @Test
    fun `opens the chronicle of the fief the map shows`() {
        val backStack: MutableList<NavKey> =
            mutableListOf(Destination.Fief(secondFief), Destination.Map(secondFief))

        Navigator(backStack).openChronicle()

        assertEquals(listOf(Destination.Fief(secondFief), Destination.Chronicle(secondFief)), backStack)
    }

    @Test
    fun `opens no tab while the fiefs are listed`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.FirstFief)
        val navigator: Navigator = Navigator(backStack)

        navigator.openMap()
        navigator.openChronicle()

        assertEquals(listOf(Destination.FirstFief), backStack)
    }

    @Test
    fun `opens the chronicle above the fief`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief)

        Navigator(backStack).openChronicle()

        assertEquals(listOf(fief, chronicle), backStack)
    }

    @Test
    fun `keeps one chronicle when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, chronicle)

        Navigator(backStack).openChronicle()

        assertEquals(listOf(fief, chronicle), backStack)
    }

    @Test
    fun `returns to the fief below the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, chronicle)

        Navigator(backStack).openFief()

        assertEquals(listOf(fief), backStack)
    }

    @Test
    fun `returns to sign-in alone once signed out`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, chronicle)

        Navigator(backStack).signedOut(isSessionEnded = false)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `opens the map above the fief and pops back to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief)
        val navigator: Navigator = Navigator(backStack)

        navigator.openMap()
        assertEquals(listOf(fief, map), backStack)
        navigator.openFief()

        assertEquals(listOf(fief), backStack)
    }

    @Test
    fun `keeps one map when it is opened twice`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, map)

        Navigator(backStack).openMap()

        assertEquals(listOf(fief, map), backStack)
    }

    @Test
    fun `returns to the fief on back from the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, map)

        Navigator(backStack).back()

        assertEquals(listOf(fief), backStack)
    }

    @Test
    fun `opens the map in place of the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, chronicle)

        Navigator(backStack).openMap()

        assertEquals(listOf(fief, map), backStack)
    }

    @Test
    fun `opens the chronicle in place of the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, map)

        Navigator(backStack).openChronicle()

        assertEquals(listOf(fief, chronicle), backStack)
    }

    @Test
    fun `returns to the fief on back from the chronicle`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, chronicle)

        Navigator(backStack).back()

        assertEquals(listOf(fief), backStack)
    }

    @Test
    fun `leaves the back stack unchanged when the map or the chronicle is tapped while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief)
        val navigator: Navigator = Navigator(backStack)

        navigator.signingOut()
        navigator.openMap()
        navigator.openChronicle()

        assertEquals(listOf(fief), backStack)
    }

    @Test
    fun `disables the tabs while signing out`() {
        val navigator: Navigator = Navigator(mutableListOf(fief))

        navigator.signingOut()

        assertFalse(navigator.areTabsEnabled)
    }

    @Test
    fun `enables the tabs again for the next session`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief)
        val navigator: Navigator = Navigator(backStack)
        navigator.signingOut()
        navigator.signedOut(isSessionEnded = false)

        navigator.signedIn()
        navigator.firstFiefOpened(firstListed)
        navigator.openMap()

        assertEquals(true to listOf(fief, map), navigator.areTabsEnabled to backStack)
    }

    @Test
    fun `returns to sign-in alone once signed out from the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(fief, map)

        Navigator(backStack).signedOut(isSessionEnded = false)

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `leaves sign-in alone with the session-ended line when the session ends above the fief`() = runTest {
        val signedInStacks: List<MutableList<NavKey>> = listOf(
            mutableListOf(Destination.FirstFief),
            mutableListOf(fief),
            mutableListOf(fief, map),
            mutableListOf(fief, chronicle),
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
}
