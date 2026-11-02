package com.emm.mygame.core.network

import kotlin.time.Duration

data class RecruitTerms(val cost: List<ResourceCost>, val peasants: Int, val perUnit: Duration)
