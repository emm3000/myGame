package com.emm.mygame.core.model.account

import kotlinx.serialization.Serializable

@Serializable
@JvmInline
value class PasswordResetToken(val value: String) {

    init {
        require(value.isNotEmpty()) { "a password reset token is never empty" }
    }
}
