package com.emm.mygame.core.network

@JvmInline
value class LessonId(val value: String) {

    init {
        require(value.isNotBlank()) { "a lesson id is never blank" }
    }
}
