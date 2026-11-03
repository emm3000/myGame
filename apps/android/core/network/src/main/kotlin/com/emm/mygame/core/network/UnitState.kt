package com.emm.mygame.core.network

data class UnitState(
    val kind: UnitKind,
    val count: Int,
    val away: Int,
    val barracksLevel: Int,
    val carry: Int,
    val roadPercent: Int,
    val terms: RecruitTerms,
)
