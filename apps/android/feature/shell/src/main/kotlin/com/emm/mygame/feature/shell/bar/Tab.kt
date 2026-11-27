package com.emm.mygame.feature.shell.bar

import androidx.annotation.StringRes
import com.emm.mygame.feature.shell.R

enum class Tab(@StringRes val label: Int) {
    Today(R.string.shell_navigation_today),
    Town(R.string.shell_navigation_town),
    Learn(R.string.shell_navigation_learn),
    Me(R.string.shell_navigation_me),
}
