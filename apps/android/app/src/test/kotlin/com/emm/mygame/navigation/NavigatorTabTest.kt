package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NavigatorTabTest : NavigatorFixture() {

    @Test
    fun `a tab change cuts the stack to Today and adds the tab's root`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Map)

        Navigator(backStack, NavigationLinks()).openTab(Tab.Learn)

        assertEquals(listOf(Destination.Today, Destination.School), backStack)
    }

    @Test
    fun `the Today tab cuts the stack to Today alone`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Settings)

        Navigator(backStack, NavigationLinks()).openTab(Tab.Today)

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `the open tab's own button returns to its root`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Map)

        Navigator(backStack, NavigationLinks()).openTab(Tab.Town)

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `back on a tab's root shows Today`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Settings)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `back on Today keeps Today for the system to leave the game`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `a task screen opens above what opened it`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today)

        Navigator(backStack, NavigationLinks()).openLesson(firstLesson, walked = emptyList())

        assertEquals(listOf(Destination.Today, firstWords), backStack)
    }

    @Test
    fun `the open tab is read from the stack`() {
        assertEquals(Tab.Town, listOf(Destination.Today, Destination.Town, Destination.Map).openTab())
        assertEquals(Tab.Today, listOf(Destination.Today, Destination.Report).openTab())
        assertEquals(Tab.Me, listOf(Destination.Today, Destination.Settings).openTab())
    }

    @Test
    fun `a task screen draws no bar`() {
        assertNull(listOf(Destination.Today, firstWords).openTab())
        assertNull(listOf(Destination.Today, Destination.Town, Destination.Review).openTab())
        assertNull(listOf(Destination.Today, Destination.Placement).openTab())
        assertNull(listOf(Destination.Today, firstBandEighthWeek).openTab())
    }

    @Test
    fun `changes no tab while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openTab(Tab.Me)

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `signing in shows Today`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).signedIn()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }

    @Test
    fun `a town with no name shows the naming alone`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.School)

        Navigator(backStack, NavigationLinks()).townUnnamed()

        assertEquals(listOf<NavKey>(Destination.Naming), backStack)
        assertNull(backStack.openTab())
    }

    @Test
    fun `Today follows the naming`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Naming)

        Navigator(backStack, NavigationLinks()).townNamed()

        assertEquals(listOf<NavKey>(Destination.Today), backStack)
    }
}
