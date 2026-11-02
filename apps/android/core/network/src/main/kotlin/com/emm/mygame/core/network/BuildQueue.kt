package com.emm.mygame.core.network

data class BuildQueue(val entries: List<WaitingUpgrade>, val cap: Int)
