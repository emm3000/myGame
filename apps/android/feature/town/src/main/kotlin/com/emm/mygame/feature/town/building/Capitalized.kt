package com.emm.mygame.feature.town.building

import com.emm.mygame.core.ui.CopyReader

internal fun CopyReader.capitalized(name: String): String =
    name.replaceFirstChar { first: Char -> first.titlecase(locale) }
