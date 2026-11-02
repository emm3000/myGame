package com.emm.mygame.core.network

@JvmInline
value class FiefId(val value: String) {

    init {
        require(value.isNotBlank()) { "a fief id is never blank" }
    }
}
