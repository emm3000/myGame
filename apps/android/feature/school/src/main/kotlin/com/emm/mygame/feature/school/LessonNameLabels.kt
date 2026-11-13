package com.emm.mygame.feature.school

import androidx.compose.runtime.Composable
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.ui.fixedCopyResource
import com.emm.mygame.core.ui.icuStringResource

@Composable
internal fun lessonTitleOf(name: LessonName): String = when (name) {
    is LessonName.Shelved -> icuStringResource(R.string.school_lesson_title, "number" to name.number.toString())
    is LessonName.Released -> fixedCopyResource(
        R.string.school_released_lesson,
        "band" to name.band.number.toString(),
        "number" to name.set.toString(),
    )
}

@Composable
internal fun slotBusyLineOf(name: LessonName): String = when (name) {
    is LessonName.Shelved -> icuStringResource(R.string.school_lesson_slot_busy, "number" to name.number.toString())
    is LessonName.Released -> fixedCopyResource(
        R.string.school_lesson_slot_busy_released,
        "band" to name.band.number.toString(),
        "number" to name.set.toString(),
    )
}

@Composable
internal fun slotStopNameOf(name: LessonName): String = when (name) {
    is LessonName.Shelved -> icuStringResource(R.string.school_slot_stop_of, "number" to name.number.toString())
    is LessonName.Released -> fixedCopyResource(
        R.string.school_slot_stop_of_released,
        "band" to name.band.number.toString(),
        "number" to name.set.toString(),
    )
}
