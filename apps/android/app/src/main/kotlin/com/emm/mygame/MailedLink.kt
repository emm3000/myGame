package com.emm.mygame

import android.content.Intent
import android.net.Uri
import com.emm.mygame.core.network.EmailVerificationToken
import com.emm.mygame.core.network.PasswordResetToken

internal fun mailedLinkOf(intent: Intent): Destination.MailedLink? {
    if (intent.action != Intent.ACTION_VIEW) return null
    val link: Uri = intent.data ?: return null
    if (link.scheme != WEB_SCHEME || link.host != WEB_HOST) return null
    val token: String? = link.getQueryParameter(TOKEN_PARAMETER)?.takeIf(String::isNotEmpty)
    return when (link.path) {
        RESET_PASSWORD_PATH -> Destination.ResetPassword(token?.let(::PasswordResetToken))
        VERIFY_EMAIL_PATH -> Destination.VerifyEmail(token?.let(::EmailVerificationToken))
        else -> null
    }
}

private const val WEB_SCHEME: String = "https"

private const val WEB_HOST: String = "mygame.emm3000.com"

private const val RESET_PASSWORD_PATH: String = "/reset-password"

private const val VERIFY_EMAIL_PATH: String = "/verify-email"

private const val TOKEN_PARAMETER: String = "token"
