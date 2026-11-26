package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.model.account.PasswordResetToken
import com.emm.mygame.navigation.Navigator
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorResetPasswordTest {

    private val signIn: Destination.SignIn = Destination.SignIn(isSessionEnded = false)

    private val mailedLink: Destination.ResetPassword =
        Destination.ResetPassword(PasswordResetToken("rbi-I29wMEaqgA12gHRHjVk7zceeOXQn"))

    private val newerLink: Destination.ResetPassword =
        Destination.ResetPassword(PasswordResetToken("Wq3vX0pLm9sTz7aYc2bN"))

    @Test
    fun `opens a mailed link alone in place of sign-in`() {
        val backStack: MutableList<NavKey> = mutableListOf(signIn)

        Navigator(backStack, NavigationLinks()).openMailedLink(mailedLink)

        assertEquals(listOf(mailedLink), backStack)
    }

    @Test
    fun `opens a mailed link alone in place of the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.Map)

        Navigator(backStack, NavigationLinks()).openMailedLink(mailedLink)

        assertEquals(listOf(mailedLink), backStack)
    }

    @Test
    fun `opens a newer mailed link in place of the one shown`() {
        val backStack: MutableList<NavKey> = mutableListOf(mailedLink)

        Navigator(backStack, NavigationLinks()).openMailedLink(newerLink)

        assertEquals(listOf(newerLink), backStack)
    }

    @Test
    fun `keeps a mailed link shown when a sign-in it replaced restores its session`() {
        val backStack: MutableList<NavKey> = mutableListOf(mailedLink)

        Navigator(backStack, NavigationLinks()).signedIn()

        assertEquals(listOf(mailedLink), backStack)
    }

    @Test
    fun `opens the forgot-password screen above a new sign-in in place of a refused link`() {
        val backStack: MutableList<NavKey> = mutableListOf(mailedLink)

        Navigator(backStack, NavigationLinks()).openForgotPassword()

        assertEquals(listOf(signIn, Destination.ForgotPassword), backStack)
    }

    @Test
    fun `opens a new sign-in in place of a mailed link`() {
        val backStack: MutableList<NavKey> = mutableListOf(mailedLink)

        Navigator(backStack, NavigationLinks()).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }
}
