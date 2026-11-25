package com.emm.mygame.feature.jobs

import com.emm.mygame.core.model.town.jobs.WasteSize

private const val SMALL_SIZE_NUMBER: Int = 1

private const val MEDIUM_SIZE_NUMBER: Int = 2

private const val LARGE_SIZE_NUMBER: Int = 3

internal fun sizeNumberOf(size: WasteSize): Int = when (size) {
    WasteSize.Small -> SMALL_SIZE_NUMBER
    WasteSize.Medium -> MEDIUM_SIZE_NUMBER
    WasteSize.Large -> LARGE_SIZE_NUMBER
}
