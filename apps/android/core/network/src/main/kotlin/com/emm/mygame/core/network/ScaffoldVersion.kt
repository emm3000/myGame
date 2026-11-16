package com.emm.mygame.core.network

@JvmInline
internal value class ScaffoldVersion(private val order: Int) : Comparable<ScaffoldVersion> {
    init {
        require(order >= 0) { "A scaffold version is never negative" }
    }

    override fun compareTo(other: ScaffoldVersion): Int = order.compareTo(other.order)
}
