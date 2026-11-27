package com.emm.mygame

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.core.model.account.EmailVerificationToken
import com.emm.mygame.core.model.account.PasswordResetToken
import com.emm.mygame.navigation.NavigationLinks
import com.emm.mygame.navigation.Navigator
import org.junit.Assert.assertEquals
import org.junit.Test

class NavigatorVerifyEmailTest {

    private val signIn: Destination.SignIn = Destination.SignIn(isSessionEnded = false)

    private val mailedLink: Destination.VerifyEmail =
        Destination.VerifyEmail(EmailVerificationToken("iJN9MLrLjGkKfEnbunuO4ZCbRS0xRy0Y"))

    @Test
    fun `opens a mailed verification link alone in place of the town`() {
        val backStack: MutableList<NavKey> = mutableListOf(Destination.Today, Destination.Town, Destination.School)

        Navigator(backStack, NavigationLinks()).openMailedLink(mailedLink)

        assertEquals(listOf(mailedLink), backStack)
    }

    @Test
    fun `opens a mailed reset link in place of a verification link`() {
        val resetLink: Destination.ResetPassword =
            Destination.ResetPassword(PasswordResetToken("rbi-I29wMEaqgA12gHRHjVk7zceeOXQn"))
        val backStack: MutableList<NavKey> = mutableListOf(mailedLink)

        Navigator(backStack, NavigationLinks()).openMailedLink(resetLink)

        assertEquals(listOf(resetLink), backStack)
    }

    @Test
    fun `keeps a verification link shown when a sign-in it replaced restores its session`() {
        val backStack: MutableList<NavKey> = mutableListOf(mailedLink)

        Navigator(backStack, NavigationLinks()).signedIn()

        assertEquals(listOf(mailedLink), backStack)
    }

    @Test
    fun `opens a new sign-in in place of a verification link`() {
        val backStack: MutableList<NavKey> = mutableListOf(mailedLink)

        Navigator(backStack, NavigationLinks()).openSignIn()

        assertEquals(listOf(signIn), backStack)
    }

    @Test
    fun `heads to the town through a new sign-in in place of a verification link`() {
        val backStack: MutableList<NavKey> = mutableListOf(mailedLink)

        Navigator(backStack, NavigationLinks()).openTown()

        assertEquals(listOf(signIn), backStack)
    }
}
