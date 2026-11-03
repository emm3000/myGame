package com.emm.mygame

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.FiefId
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
        showAlone(Destination.FirstFief)
    }

    fun firstFiefOpened(fief: FiefId) {
        if (backStack.lastOrNull() == Destination.FirstFief) showAlone(Destination.Fief(fief))
    }

    fun signedOut(isSessionEnded: Boolean) {
        areTabsEnabled = true
        showAlone(Destination.SignIn(isSessionEnded = isSessionEnded))
    }

    suspend fun followSessionEnds(ended: Flow<Unit>) {
        ended.collect { signedOut(isSessionEnded = true) }
    }

    fun openMap() {
        openTab { fief: FiefId -> Destination.Map(fief) }
    }

    fun openChronicle() {
        openTab { fief: FiefId -> Destination.Chronicle(fief) }
    }

    fun openFief() {
        when (backStack.lastOrNull()) {
            is Destination.Map, is Destination.Chronicle -> back()
            else -> Unit
        }
    }

    private fun openTab(tabOf: (FiefId) -> Destination) {
        if (!areTabsEnabled) return
        when (val top: NavKey? = backStack.lastOrNull()) {
            is Destination.Fief -> backStack.add(tabOf(top.fief))
            is Destination.Map -> backStack[backStack.lastIndex] = tabOf(top.fief)
            is Destination.Chronicle -> backStack[backStack.lastIndex] = tabOf(top.fief)
            else -> Unit
        }
    }

    private fun showAlone(destination: Destination) {
        if (backStack == listOf(destination)) return
        backStack.add(destination)
        repeat(backStack.size - 1) { backStack.removeAt(0) }
    }
}
