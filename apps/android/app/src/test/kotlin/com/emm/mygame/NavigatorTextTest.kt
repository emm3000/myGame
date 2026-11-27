package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.model.learning.TextId
import com.emm.mygame.feature.shell.bar.Tab
import com.emm.mygame.navigation.Navigator
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorTextTest {

    private val courseText: Destination.SchoolText = Destination.SchoolText(TextId("text-1"))

    @Test
    fun `opens a text above the school`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.School)

        Navigator(backStack, NavigationLinks()).openAbove(Destination.School, courseText)

        assertEquals(listOf(Destination.Today, Destination.School, courseText), backStack)
    }

    @Test
    fun `keeps one text on a double tap`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.School)
        val navigator: Navigator = Navigator(backStack, NavigationLinks())

        navigator.openAbove(Destination.School, courseText)
        navigator.openAbove(Destination.School, courseText)

        assertEquals(listOf(Destination.Today, Destination.School, courseText), backStack)
    }

    @Test
    fun `returns to the school from a text`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.School, courseText)

        Navigator(backStack, NavigationLinks()).openTab(Tab.Learn)

        assertEquals(listOf(Destination.Today, Destination.School), backStack)
    }

    @Test
    fun `returns to the town from a text`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.School, courseText)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(Destination.Today, Destination.Town), backStack)
    }
}
