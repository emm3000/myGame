package com.emm.mygame.core.network

import kotlin.time.Instant

fun TownSnapshot.capWaitsUntil(now: Instant): Instant? {
    val dueAt: Instant = learning.nextInLearningDueAt ?: return null
    if (nextStep is NextStep.Reviews || dueAt <= now) return null
    return dueAt
}
