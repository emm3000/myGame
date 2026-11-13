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
    val releasedLessons: List<ReleasedLesson>,
    val skills: List<EarnedSkill>,
    val learning: Learning,
    val lessonSlot: LessonSlot?,
    val hiring: Hiring,
    val job: Job?,
    val nextStep: NextStep,
    val tip: TipKind?,
    val nextDueAt: Instant?,
    val readAt: Instant,
) {

    data class Stock(
        val kind: TownResourceKind,
        val amount: Long,
        val ratePerHour: Double,
        val capacity: Long,
        val fullAt: Instant?,
    )

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
        val standings: List<WordStanding>,
    )

    data class ReleasedLesson(
        val id: LessonId,
        val band: PlacementBand,
        val position: Int,
        val duration: Duration,
        val requiredSchoolLevel: Int,
        val isStudied: Boolean,
        val wordCount: Int,
        val readings: List<WordReading>,
        val standings: List<WordStanding>,
    )

    data class WordReading(val word: String, val frame: List<FrameSpan>, val support: WordSupport?)

    data class LessonSkill(val resource: TownResourceKind, val ratePercent: Int)

    data class EarnedSkill(val lesson: LessonId, val resource: TownResourceKind, val ratePercent: Int)

    data class Learning(val cap: Int, val inLearning: Int, val retainedWords: RetainedWords?)

    data class LessonSlot(val lesson: LessonId, val startedAt: Instant, val finishesAt: Instant)

    data class Hiring(
        val order: HiringOrder?,
        val hires: Map<TownHireKind, Int>,
        val terms: Map<TownHireKind, HireTerms>,
    )

    data class HiringOrder(
        val hire: TownHireKind,
        val count: Int,
        val delivered: Int,
        val secondsPerHire: Int,
        val startedAt: Instant,
        val endsAt: Instant,
    )

    data class HireTerms(val costs: List<Cost>, val secondsPerHire: Int, val people: Int, val requiredOfficeLevel: Int)

    data class Job(
        val site: TownSite,
        val team: Map<TownHireKind, Int>,
        val task: JobTask,
        val pay: Map<TownResourceKind, Long>,
        val phase: JobPhase,
        val sentAt: Instant,
        val arrivesAt: Instant,
        val leavesAt: Instant,
        val returnsAt: Instant,
        val calledBackAt: Instant?,
    )

    sealed interface JobTask {

        data class Hours(val hours: Int) : JobTask

        data class CleanUp(val size: WasteSize, val waste: Int) : JobTask
    }

    enum class JobPhase {
        Outbound,
        Working,
        Returning,
    }
}
