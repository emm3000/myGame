package com.emm.mygame.core.network

import kotlinx.serialization.Serializable

@Serializable
@JvmInline
value class LessonId(val value: String) {

    init {
        require(value.isNotBlank()) { "a lesson id is never blank" }
    }
}
