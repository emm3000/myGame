package com.emm.mygame.core.model.learning

import kotlin.time.Instant

sealed interface ReviewVerdict {

    data object NearMiss : ReviewVerdict

    data class Correct(
        val word: String,
        val gloss: String,
        val dueAt: Instant,
        val earnedSkill: RaisedSkill?,
        val openedLevel: Int?,
    ) : ReviewVerdict

    data class Wrong(val word: String, val gloss: String, val dueAt: Instant) : ReviewVerdict
}
