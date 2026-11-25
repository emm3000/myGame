package com.emm.mygame.navigation

import androidx.navigation3.runtime.NavKey
import com.emm.mygame.Destination

internal enum class Tab(val root: Destination) {
    Today(Destination.Today),
    Town(Destination.Town),
    Learn(Destination.School),
    Me(Destination.Settings),
}

internal fun List<NavKey>.openTab(): Tab? {
    if (firstOrNull() != Destination.Today || lastOrNull().isTask()) return null
    return tabUnder()
}

internal fun List<NavKey>.tabUnder(): Tab =
    Tab.entries.firstOrNull { tab: Tab -> tab != Tab.Today && getOrNull(1) == tab.root } ?: Tab.Today

internal fun List<NavKey>.isOnTabRoot(): Boolean = openTab()?.let { tab: Tab -> lastOrNull() == tab.root } == true

private fun NavKey?.isTask(): Boolean = when (this) {
    Destination.Review, Destination.Placement, is Destination.HoldoutCheck, is Destination.LessonWords -> true
    else -> false
}
