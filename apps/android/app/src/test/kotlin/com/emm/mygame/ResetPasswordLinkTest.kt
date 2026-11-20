package com.emm.mygame

import android.content.Intent
import android.net.Uri
import com.emm.mygame.core.network.PasswordResetToken
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ResetPasswordLinkTest {

    @Test
    fun `opens the new password screen with the token a mailed link carries`() {
        val mailedLink: Intent =
            view("https://mygame.emm3000.com/reset-password?token=rbi-I29wMEaqgA12gHRHjVk7zceeOXQn")

        assertEquals(
            Destination.ResetPassword(PasswordResetToken("rbi-I29wMEaqgA12gHRHjVk7zceeOXQn")),
            resetPasswordDestinationOf(mailedLink),
        )
    }

    @Test
    fun `opens the new password screen without a token for a link that carries none`() {
        val bareLink: Intent = view("https://mygame.emm3000.com/reset-password")

        assertEquals(Destination.ResetPassword(token = null), resetPasswordDestinationOf(bareLink))
    }

    @Test
    fun `opens the new password screen without a token for a link with an empty token`() {
        val emptyTokenLink: Intent = view("https://mygame.emm3000.com/reset-password?token=")

        assertEquals(Destination.ResetPassword(token = null), resetPasswordDestinationOf(emptyTokenLink))
    }

    @Test
    fun `opens no screen for a link to another path`() {
        val verificationLink: Intent = view("https://mygame.emm3000.com/verify-email?token=9c9Yn1_BtuJZ1is8Qrx5")

        assertNull(resetPasswordDestinationOf(verificationLink))
    }

    @Test
    fun `opens no screen for a launch from the home screen`() {
        val launch: Intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)

        assertNull(resetPasswordDestinationOf(launch))
    }

    private fun view(link: String): Intent = Intent(Intent.ACTION_VIEW, Uri.parse(link))
}
