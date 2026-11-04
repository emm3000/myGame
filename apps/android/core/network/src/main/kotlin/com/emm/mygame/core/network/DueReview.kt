package com.emm.mygame.core.network

import kotlin.time.Instant

sealed interface DueReview {

    val wordId: WordId

    data class Recognition(
        override val wordId: WordId,
        val lesson: LessonId,
        val dueAt: Instant,
        val word: String,
        val frame: String,
        val choices: List<ReviewChoice>,
    ) : DueReview

    data class Recall(
        override val wordId: WordId,
        val lesson: LessonId,
        val dueAt: Instant,
        val gloss: String,
        val gappedFrame: String,
    ) : DueReview
}
