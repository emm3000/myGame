package com.emm.mygame

import androidx.navigation3.runtime.NavKey

internal class Navigator(private val backStack: MutableList<NavKey>) {

    fun back() {
        if (backStack.size > 1) backStack.removeAt(backStack.lastIndex)
    }

    fun openSignUp() {
        if (backStack.lastOrNull() == Destination.SignIn) backStack.add(Destination.SignUp)
    }

    fun openSignIn() {
        if (backStack.lastOrNull() == Destination.SignUp) back()
    }

    fun signedIn() {
        showAlone(Destination.Fief)
    }

    fun signedOut() {
        showAlone(Destination.SignIn)
    }

    fun openMap() {
        openTab(Destination.Map)
    }

    fun openChronicle() {
        openTab(Destination.Chronicle)
    }

    fun openFief() {
        if (backStack.lastOrNull() in tabsAboveFief) back()
    }

    private fun openTab(tab: Destination) {
        val top: NavKey? = backStack.lastOrNull()
        when {
            top == tab -> Unit
            top == Destination.Fief -> backStack.add(tab)
            top in tabsAboveFief -> backStack[backStack.lastIndex] = tab
        }
    }

    private fun showAlone(destination: Destination) {
        backStack.add(destination)
        repeat(backStack.size - 1) { backStack.removeAt(0) }
    }

    private companion object {
        val tabsAboveFief: Set<Destination> = setOf(Destination.Map, Destination.Chronicle)
    }
}
