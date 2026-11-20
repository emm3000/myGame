package com.emm.mygame

import android.content.Intent
import android.net.Uri
import com.emm.mygame.core.network.PasswordResetToken

internal fun resetPasswordDestinationOf(intent: Intent): Destination.ResetPassword? {
    if (intent.action != Intent.ACTION_VIEW) return null
    val link: Uri = intent.data ?: return null
    if (link.scheme != WEB_SCHEME || link.host != WEB_HOST || link.path != RESET_PASSWORD_PATH) return null
    val token: String? = link.getQueryParameter(TOKEN_PARAMETER)?.takeIf(String::isNotEmpty)
    return Destination.ResetPassword(token?.let(::PasswordResetToken))
}

private const val WEB_SCHEME: String = "https"

private const val WEB_HOST: String = "mygame.emm3000.com"

private const val RESET_PASSWORD_PATH: String = "/reset-password"

private const val TOKEN_PARAMETER: String = "token"
