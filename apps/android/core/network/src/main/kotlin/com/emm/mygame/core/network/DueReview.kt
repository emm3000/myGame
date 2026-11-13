package com.emm.mygame.core.network

import kotlin.time.Instant

sealed interface DueReview {

    val wordId: WordId

    val lesson: LessonId

    data class Recognition(
        override val wordId: WordId,
        override val lesson: LessonId,
        val dueAt: Instant,
        val word: String,
        val frame: List<FrameSpan>,
        val choices: List<ReviewChoice>,
    ) : DueReview

    data class Recall(
        override val wordId: WordId,
        override val lesson: LessonId,
        val dueAt: Instant,
        val gloss: String,
        val gappedFrame: List<FrameSpan>,
    ) : DueReview
}
