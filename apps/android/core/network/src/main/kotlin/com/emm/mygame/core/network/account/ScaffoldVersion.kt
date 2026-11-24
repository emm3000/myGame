package com.emm.mygame.core.network.account

@JvmInline
internal value class ScaffoldVersion(private val order: Int) : Comparable<ScaffoldVersion> {
    override fun compareTo(other: ScaffoldVersion): Int = order.compareTo(other.order)
}
