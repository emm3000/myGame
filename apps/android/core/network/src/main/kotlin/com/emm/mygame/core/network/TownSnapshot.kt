package com.emm.mygame.core.network

import kotlin.time.Duration
import kotlin.time.Instant

data class TownSnapshot(
    val name: String,
    val label: TownLabel,
    val seasonInForce: SeasonInForce?,
    val seasonEndsAt: Instant?,
    val stocks: List<Stock>,
    val people: People,
    val buildings: List<Building>,
    val work: Work,
    val lessons: List<Lesson>,
    val skills: List<EarnedSkill>,
    val learning: Learning,
    val lessonSlot: LessonSlot?,
    val readAt: Instant,
) {

    data class Stock(val kind: TownResourceKind, val amount: Long, val ratePerHour: Double, val capacity: Long)

    data class People(val supplied: Int, val free: Int, val atWork: Int)

    data class Building(val kind: TownBuildingKind, val level: Int, val next: NextLevel?)

    data class NextLevel(val level: Int, val costs: List<Cost>, val duration: Duration, val people: Int)

    data class Cost(val kind: TownResourceKind, val amount: Long)

    data class Work(val slot: WorkItem?, val waitingList: List<WorkItem>, val cap: Int)

    data class WorkItem(
        val building: TownBuildingKind,
        val level: Int,
        val startsAt: Instant,
        val finishesAt: Instant,
    )

    data class Lesson(
        val id: LessonId,
        val theme: String,
        val duration: Duration,
        val requiredSchoolLevel: Int,
        val skill: LessonSkill,
        val isStudied: Boolean,
        val wordCount: Int,
        val readings: List<WordReading>,
    )

    data class WordReading(val word: String, val gloss: String, val frame: String)

    data class LessonSkill(val resource: TownResourceKind, val ratePercent: Int)

    data class EarnedSkill(val lesson: LessonId, val resource: TownResourceKind, val ratePercent: Int)

    data class Learning(val cap: Int, val inLearning: Int, val retainedWords: RetainedWords?)

    data class LessonSlot(val lesson: LessonId, val startedAt: Instant, val finishesAt: Instant)
}
