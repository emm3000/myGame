package com.emm.mygame.core.network

data class TownRegistered(
    val raisedPlaces: List<RaisedPlace>,
    val ringRise: RingRise?,
    val finishedLesson: LessonId?,
) {

    data class RaisedPlace(val kind: TownBuildingKind, val levelBefore: Int)

    data class RingRise(val countBefore: Int)

    companion object {
        val nothing: TownRegistered = TownRegistered(raisedPlaces = emptyList(), ringRise = null, finishedLesson = null)
    }
}

fun registeredBetween(previous: TownSnapshot, next: TownSnapshot): TownRegistered = TownRegistered(
    raisedPlaces = next.buildings.mapNotNull { place: TownSnapshot.Building -> previous.raisedPlaceOf(place) },
    ringRise = ringRiseBetween(previous.learning.retainedWords, next.learning.retainedWords),
    finishedLesson = previous.lessonFinishedIn(next),
)

private fun TownSnapshot.raisedPlaceOf(place: TownSnapshot.Building): TownRegistered.RaisedPlace? {
    val levelBefore: Int = buildings.firstOrNull { held: TownSnapshot.Building -> held.kind == place.kind }?.level
        ?: return null
    return if (place.level > levelBefore) TownRegistered.RaisedPlace(place.kind, levelBefore) else null
}

private fun ringRiseBetween(previous: RetainedWords?, next: RetainedWords?): TownRegistered.RingRise? {
    if (previous == null || next == null) return null
    if (previous.total != next.total || next.count <= previous.count) return null
    return TownRegistered.RingRise(countBefore = previous.count)
}

private fun TownSnapshot.lessonFinishedIn(next: TownSnapshot): LessonId? {
    val running: LessonId = lessonSlot?.lesson ?: return null
    return next.lessons.firstOrNull { lesson: TownSnapshot.Lesson -> lesson.id == running && lesson.isStudied }?.id
}
