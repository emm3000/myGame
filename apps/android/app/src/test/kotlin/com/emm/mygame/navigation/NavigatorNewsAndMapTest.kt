package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorNewsAndMapTest : NavigatorFixture() {

    @Test
    fun `stays on the town when the town tab is tapped`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens the news above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openAbove(Destination.Town, Destination.News)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.News), backStack)
    }

    @Test
    fun `returns to the town on back from the news`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.News)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `returns to the town on its tab from the news`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.News)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens the news from the screen that asked for it only`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.School)

        Navigator(backStack, NavigationLinks()).openAbove(Destination.Town, Destination.News)

        assertEquals(listOf(Destination.Today, Destination.School), backStack)
    }

    @Test
    fun `opens no news while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openAbove(Destination.Town, Destination.News)

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens the map above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openOnTab(Destination.Map)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Map), backStack)
    }

    @Test
    fun `returns to the town on back from the map`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Map)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens the placement above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openOnTab(Destination.Placement)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Placement), backStack)
    }

    @Test
    fun `returns to the town from the placement`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Placement)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens no placement from sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openOnTab(Destination.Placement)

        assertEquals(listOf<NavKey>(signIn), backStack)
    }

    @Test
    fun `opens no placement while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openOnTab(Destination.Placement)

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }
}
