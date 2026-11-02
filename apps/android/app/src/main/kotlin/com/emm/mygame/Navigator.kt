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

    fun openChronicle() {
        if (backStack.lastOrNull() == Destination.Fief) backStack.add(Destination.Chronicle)
    }

    fun openFief() {
        if (backStack.lastOrNull() == Destination.Chronicle) back()
    }

    private fun showAlone(destination: Destination) {
        backStack.add(destination)
        repeat(backStack.size - 1) { backStack.removeAt(0) }
    }
}
