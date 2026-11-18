package com.emm.mygame

import androidx.navigation3.runtime.NavKey

internal fun Navigator.openFromDock(open: Navigator.() -> Unit) {
    if (!areLinksEnabled) return
    val before: NavKey? = shown
    open()
    if (shown != before) return
    openTown()
    open()
}
