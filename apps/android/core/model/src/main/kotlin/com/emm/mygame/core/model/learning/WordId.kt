package com.emm.mygame.core.model.learning

@JvmInline
value class WordId(val value: String) {

    init {
        require(value.isNotBlank()) { "a word id is never blank" }
    }
}
