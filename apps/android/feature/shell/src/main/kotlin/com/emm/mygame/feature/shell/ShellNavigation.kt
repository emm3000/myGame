package com.emm.mygame.feature.shell

import com.emm.mygame.feature.shell.bar.Tab

data class ShellNavigation(
    val tabUnder: Tab,
    val isOnTabRoot: Boolean,
    val areLinksEnabled: Boolean,
    val onTabOpen: (Tab) -> Unit,
)
