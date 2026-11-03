package com.emm.mygame.core.network

import kotlinx.serialization.Serializable

@Serializable
@JvmInline
value class FiefId(val value: String) {

    init {
        require(value.isNotBlank()) { "a fief id is never blank" }
    }
}
