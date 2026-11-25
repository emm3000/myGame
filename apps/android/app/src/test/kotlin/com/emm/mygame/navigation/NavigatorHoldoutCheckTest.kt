package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination
import com.emm.mygame.NavigationLinks
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.placement.PlacementBand
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorHoldoutCheckTest : NavigatorFixture() {

    @Test
    fun `opens the holdout check of its band and week above the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School, firstBandEighthWeek), backStack)
    }

    @Test
    fun `returns to the school on back from the holdout check`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.School,
            firstBandEighthWeek,
        )

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School), backStack)
    }

    @Test
    fun `returns to the town from the holdout check`() {
        val backStack: MutableList<NavKey> = mutableListOf(
            Destination.Today,
            Destination.Town,
            Destination.School,
            firstBandEighthWeek,
        )

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `keeps one holdout check on a double tap`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())

        navigator.openHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)
        navigator.openHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School, firstBandEighthWeek), backStack)
    }

    @Test
    fun `opens the holdout check above the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town)

        Navigator(backStack, NavigationLinks()).openHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)

        assertEquals(listOf(Destination.Today, Destination.Town, firstBandEighthWeek), backStack)
    }

    @Test
    fun `returns to the town on back from a holdout check the town opened`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, firstBandEighthWeek)

        Navigator(backStack, NavigationLinks()).back()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }

    @Test
    fun `opens no holdout check from the Report`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.Report), backStack)
    }

    @Test
    fun `opens no holdout check while signing out`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())
        navigator.signingOut()

        navigator.openHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)

        assertEquals(listOf(Destination.Today, Destination.Town, Destination.School), backStack)
    }
}
