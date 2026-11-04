package com.emm.mygame.core.network

import kotlin.time.Instant

sealed interface ReviewVerdict {

    data object NearMiss : ReviewVerdict

    data class Correct(val word: String, val gloss: String, val dueAt: Instant, val earnedSkill: RaisedSkill?) :
        ReviewVerdict

    data class Wrong(val word: String, val gloss: String, val dueAt: Instant) : ReviewVerdict
}
