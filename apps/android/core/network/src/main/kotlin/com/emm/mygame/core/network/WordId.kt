package com.emm.mygame.core.network

@JvmInline
value class WordId(val value: String) {

    init {
        require(value.isNotBlank()) { "a word id is never blank" }
    }
}
