package com.emm.mygame.feature.school

import com.emm.mygame.core.designsystem.MyGameLabel
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.ui.CopyReader
import com.emm.mygame.core.ui.PlayerCopy

internal fun PlayerCopy.releasedTitleOf(band: PlacementBand, set: Int): MyGameLabel = fixedLabelOf(
    fixedCopy(R.string.school_released_lesson, "band" to band.number.toString(), "number" to set.toString()),
)

private fun PlayerCopy.releasedLineOf(
    name: LessonName.Released,
    line: CopyReader.(title: String) -> String,
): MyGameLabel {
    val fixedTitle: String = releasedTitleOf(name.band, name.set).text
    return chrome { line(fixedTitle) }
}

internal fun PlayerCopy.lessonLineOf(name: LessonName, line: CopyReader.(title: String) -> String): MyGameLabel =
    when (name) {
        is LessonName.Shelved -> chrome { line(text(R.string.school_lesson_title, "number" to name.number.toString())) }
        is LessonName.Released -> releasedLineOf(name, line)
    }

internal fun PlayerCopy.lessonTitleOf(name: LessonName): MyGameLabel = lessonLineOf(name) { title: String -> title }

internal fun PlayerCopy.slotBusyLineOf(name: LessonName): MyGameLabel = when (name) {
    is LessonName.Shelved -> chrome(R.string.school_lesson_slot_busy, "number" to name.number.toString())
    is LessonName.Released -> fixedLabelOf(
        fixedCopy(
            R.string.school_lesson_slot_busy_released,
            "band" to name.band.number.toString(),
            "number" to name.set.toString(),
        ),
    )
}

internal fun PlayerCopy.slotStopNameOf(name: LessonName): String = when (name) {
    is LessonName.Shelved -> chrome(R.string.school_slot_stop_of, "number" to name.number.toString()).spoken
    is LessonName.Released -> fixedCopy(
        R.string.school_slot_stop_of_released,
        "band" to name.band.number.toString(),
        "number" to name.set.toString(),
    )
}
