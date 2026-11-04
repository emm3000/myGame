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

    fun openForgotPassword() {
        if (backStack.lastOrNull() is Destination.SignIn) backStack.add(Destination.ForgotPassword)
    }

    fun openSignIn() {
        when (backStack.lastOrNull()) {
            Destination.SignUp, Destination.ForgotPassword -> back()
            else -> Unit
        }
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

    fun openReview() {
        val top: NavKey? = backStack.lastOrNull()
        if (top is Destination.Fief) backStack.add(Destination.Review(top.fief))
    }

    fun openFief() {
        when (backStack.lastOrNull()) {
            is Destination.Map, is Destination.Chronicle -> back()
            else -> Unit
        }
    }

    fun switchFief(fief: FiefId) {
        if (!areTabsEnabled) return
        val shown: List<Destination> = when (backStack.lastOrNull()) {
            is Destination.Fief -> listOf(Destination.Fief(fief))
            is Destination.Map -> listOf(Destination.Fief(fief), Destination.Map(fief))
            is Destination.Chronicle -> listOf(Destination.Fief(fief), Destination.Chronicle(fief))
            else -> return
        }
        showAlone(shown)
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
        showAlone(listOf(destination))
    }

    private fun showAlone(destinations: List<Destination>) {
        if (backStack == destinations) return
        val replaced: Int = backStack.size
        backStack.addAll(destinations)
        repeat(replaced) { backStack.removeAt(0) }
    }
}
