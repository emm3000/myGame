package com.emm.mygame

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.navigation3.runtime.NavKey
import kotlinx.coroutines.flow.Flow

internal class Navigator(private val backStack: MutableList<NavKey>) {

    var areTabsEnabled: Boolean by mutableStateOf(true)
        private set

    fun signingOut() {
        areTabsEnabled = false
    }

    fun back() {
        if (backStack.size > 1) backStack.removeAt(backStack.lastIndex)
    }

    fun openSignUp() {
        if (backStack.lastOrNull() is Destination.SignIn) backStack.add(Destination.SignUp)
    }

    fun openSignIn() {
        if (backStack.lastOrNull() == Destination.SignUp) back()
    }

    fun signedIn() {
        showAlone(Destination.Fief)
    }

    fun signedOut(isSessionEnded: Boolean) {
        areTabsEnabled = true
        showAlone(Destination.SignIn(isSessionEnded = isSessionEnded))
    }

    suspend fun followSessionEnds(ended: Flow<Unit>) {
        ended.collect { signedOut(isSessionEnded = true) }
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
            !areTabsEnabled -> Unit
            top == tab -> Unit
            top == Destination.Fief -> backStack.add(tab)
            top in tabsAboveFief -> backStack[backStack.lastIndex] = tab
        }
    }

    private fun showAlone(destination: Destination) {
        if (backStack == listOf(destination)) return
        backStack.add(destination)
        repeat(backStack.size - 1) { backStack.removeAt(0) }
    }

    private companion object {
        val tabsAboveFief: Set<Destination> = setOf(Destination.Map, Destination.Chronicle)
    }
}
