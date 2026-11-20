package com.emm.mygame

import android.content.Intent
import android.net.Uri
import com.emm.mygame.core.network.EmailVerificationToken
import com.emm.mygame.core.network.PasswordResetToken
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class MailedLinkTest {

    @Test
    fun `opens the new password screen with the token a mailed link carries`() {
        val mailedLink: Intent =
            view("https://mygame.emm3000.com/reset-password?token=rbi-I29wMEaqgA12gHRHjVk7zceeOXQn")

        assertEquals(
            Destination.ResetPassword(PasswordResetToken("rbi-I29wMEaqgA12gHRHjVk7zceeOXQn")),
            mailedLinkOf(mailedLink),
        )
    }

    @Test
    fun `opens the new password screen without a token for a link that carries none`() {
        val bareLink: Intent = view("https://mygame.emm3000.com/reset-password")

        assertEquals(Destination.ResetPassword(token = null), mailedLinkOf(bareLink))
    }

    @Test
    fun `opens the new password screen without a token for a link with an empty token`() {
        val emptyTokenLink: Intent = view("https://mygame.emm3000.com/reset-password?token=")

        assertEquals(Destination.ResetPassword(token = null), mailedLinkOf(emptyTokenLink))
    }

    @Test
    fun `opens no screen for a link to another path`() {
        val signUpLink: Intent = view("https://mygame.emm3000.com/sign-up?token=9c9Yn1_BtuJZ1is8Qrx5")

        assertNull(mailedLinkOf(signUpLink))
    }

    @Test
    fun `opens the confirm-email landing with the token a mailed link carries`() {
        val mailedLink: Intent =
            view("https://mygame.emm3000.com/verify-email?token=iJN9MLrLjGkKfEnbunuO4ZCbRS0xRy0Y")

        assertEquals(
            Destination.VerifyEmail(EmailVerificationToken("iJN9MLrLjGkKfEnbunuO4ZCbRS0xRy0Y")),
            mailedLinkOf(mailedLink),
        )
    }

    @Test
    fun `opens the confirm-email landing without a token for a link that carries none`() {
        val bareLink: Intent = view("https://mygame.emm3000.com/verify-email")

        assertEquals(Destination.VerifyEmail(token = null), mailedLinkOf(bareLink))
    }

    @Test
    fun `opens the confirm-email landing without a token for a link with an empty token`() {
        val emptyTokenLink: Intent = view("https://mygame.emm3000.com/verify-email?token=")

        assertEquals(Destination.VerifyEmail(token = null), mailedLinkOf(emptyTokenLink))
    }

    @Test
    fun `opens no screen for a path below the verify path`() {
        val resendPath: Intent = view("https://mygame.emm3000.com/verify-email/resend?token=planted")

        assertNull(mailedLinkOf(resendPath))
    }

    @Test
    fun `opens no screen for a verify path on another host`() {
        val foreignHost: Intent = view("https://evil.example/verify-email?token=planted")

        assertNull(mailedLinkOf(foreignHost))
    }

    @Test
    fun `opens no screen for a verify path under another scheme`() {
        val foreignScheme: Intent = view("http://mygame.emm3000.com/verify-email?token=planted")

        assertNull(mailedLinkOf(foreignScheme))
    }

    @Test
    fun `opens no screen for a reset path on another host`() {
        val foreignHost: Intent = view("https://evil.example/reset-password?token=planted")

        assertNull(mailedLinkOf(foreignHost))
    }

    @Test
    fun `opens no screen for a reset path under another scheme`() {
        val foreignScheme: Intent = view("content://mygame.emm3000.com/reset-password?token=planted")

        assertNull(mailedLinkOf(foreignScheme))
    }

    @Test
    fun `opens no screen for a launch from the home screen`() {
        val launch: Intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)

        assertNull(mailedLinkOf(launch))
    }

    private fun view(link: String): Intent = Intent(Intent.ACTION_VIEW, Uri.parse(link))
}
