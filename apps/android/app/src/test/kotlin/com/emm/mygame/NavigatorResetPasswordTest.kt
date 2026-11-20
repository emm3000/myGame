package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.network.PasswordResetToken
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorResetPasswordTest {

    private val signIn: Destination.SignIn = Destination.SignIn(isSessionEnded = false)

    private val mailedLink: Destination.ResetPassword =
        Destination.ResetPassword(PasswordResetToken("rbi-I29wMEaqgA12gHRHjVk7zceeOXQn"))

    private val newerLink: Destination.ResetPassword =
        Destination.ResetPassword(PasswordResetToken("Wq3vX0pLm9sTz7aYc2bN"))

    @Test
    fun `opens a mailed link above sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openResetPassword(mailedLink)

        assertEquals(listOf(signIn, mailedLink), backStack)
    }

    @Test
    fun `opens a mailed link above sign-in in place of the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Town, Destination.Report)

        Navigator(backStack, NavigationLinks()).openResetPassword(mailedLink)

        assertEquals(listOf(signIn, mailedLink), backStack)
    }

    @Test
    fun `opens a newer mailed link in place of the one shown`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, mailedLink)

        Navigator(backStack, NavigationLinks()).openResetPassword(newerLink)

        assertEquals(listOf(signIn, newerLink), backStack)
    }

    @Test
    fun `keeps a mailed link shown when the session under it restores`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, mailedLink)

        Navigator(backStack, NavigationLinks()).signedIn()

        assertEquals(listOf(signIn, mailedLink), backStack)
    }

    @Test
    fun `opens the forgot-password screen in place of a refused link`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, mailedLink)

        Navigator(backStack, NavigationLinks()).openForgotPassword()

        assertEquals(listOf(signIn, Destination.ForgotPassword), backStack)
    }

    @Test
    fun `returns to sign-in when the changed password links to it`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn, mailedLink)

        Navigator(backStack, NavigationLinks()).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }
}
