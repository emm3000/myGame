package com.emm.mygame.core.model.account

import kotlinx.serialization.Serializable

@Serializable
@JvmInline
value class EmailVerificationToken(val value: String) {

    init {
        require(value.isNotEmpty()) { "an email verification token is never empty" }
    }
}
