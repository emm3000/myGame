package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorReportAndMapTest : NavigatorFixture() {

    @Test
    fun `stays on the town when the town tab is tapped`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens the Report above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openOnTab(Destination.Report)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `keeps one Report on a second tap of its tab`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openOnTab(Destination.Report)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `replaces the school with the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openOnTab(Destination.Report)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `returns to the Report from the review on its tab`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.Report,
            Destination.Review,
        )

        Navigator(backStack, NavigationLinks()).openOnTab(Destination.Report)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `leaves the school behind on the Report tab from a review opened there`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.School,
            Destination.Review,
        )

        Navigator(backStack, NavigationLinks()).openOnTab(Destination.Report)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `opens the news above the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openAbove(Destination.Report, Destination.News)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report, Destination.News), backStack)
    }

    @Test
    fun `returns to the Report on back from the news`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.Report,
            Destination.News,
        )

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `returns to the town on its tab from the news`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.Report,
            Destination.News,
        )

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens the news from the Report only`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openAbove(Destination.Report, Destination.News)

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens no news while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openAbove(Destination.Report, Destination.News)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `opens the settings above the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openAbove(Destination.Report, Destination.Settings)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report, Destination.Settings), backStack)
    }

    @Test
    fun `returns to the Report on back from the settings`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.Report,
            Destination.Settings,
        )

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `returns to the town from the settings`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.Report,
            Destination.Settings,
        )

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens the settings from the Report only`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openAbove(Destination.Report, Destination.Settings)

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens no settings while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Report)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openAbove(Destination.Report, Destination.Settings)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
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
