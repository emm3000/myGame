package com.emm.mygame.core.network

import kotlin.time.Duration

data class HeldTown(val town: TownSnapshot, val gap: Duration)
