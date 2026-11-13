package com.emm.mygame.core.network

sealed interface LessonName {

    data class Shelved(val number: Int) : LessonName

    data class Released(val band: PlacementBand, val set: Int) : LessonName
}

fun TownSnapshot.nameOf(lesson: LessonId): LessonName {
    val released: TownSnapshot.ReleasedLesson = releasedLessons
        .firstOrNull { held: TownSnapshot.ReleasedLesson -> held.id == lesson }
        ?: return LessonName.Shelved(numberOf(lesson))
    return LessonName.Released(released.band, released.position)
}
