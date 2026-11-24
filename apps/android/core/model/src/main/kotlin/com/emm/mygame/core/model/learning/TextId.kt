package com.emm.mygame.core.model.learning

import kotlinx.serialization.Serializable

@Serializable
@JvmInline
value class TextId(val value: String) {

    init {
        require(value.isNotBlank()) { "a text id is never blank" }
    }
}
