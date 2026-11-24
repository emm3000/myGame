package com.emm.mygame.core.model.town

import com.emm.mygame.core.model.town.guidance.NextStep
import kotlin.time.Instant

fun TownSnapshot.capWaitsUntil(now: Instant): Instant? {
    val dueAt: Instant = learning.nextInLearningDueAt ?: return null
    if (nextStep is NextStep.Reviews || dueAt <= now) return null
    return dueAt
}
