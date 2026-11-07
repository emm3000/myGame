package com.emm.mygame.core.network

data class SchoolPathCounts(val held: Int, val read: Int, val reviewed: Int, val learned: Int)

fun schoolPathCountsOf(standings: List<WordStanding>): SchoolPathCounts {
    val past: (WordStanding) -> Int = { step: WordStanding ->
        standings.count { standing: WordStanding -> standing > step }
    }
    return SchoolPathCounts(
        held = past(WordStanding.NotStarted),
        read = past(WordStanding.Recognize),
        reviewed = past(WordStanding.Recall),
        learned = past(WordStanding.Hold),
    )
}
