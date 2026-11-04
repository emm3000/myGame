package com.emm.mygame.core.network

@JvmInline
value class ChoiceId(val value: String) {

    init {
        require(value.isNotBlank()) { "a choice id is never blank" }
    }
}
