package com.emm.mygame.feature.school

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.LessonName
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.PlacementBand
import com.emm.mygame.core.network.SeasonInForce
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.network.WordStanding
import com.emm.mygame.core.network.nextStepCard
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
import com.emm.mygame.core.testing.hiringOf
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds
import kotlin.time.Instant
import kotlinx.coroutines.CoroutineStart
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent

internal val readInstant: Instant = Instant.parse("2026-11-05T10:00:00Z")

internal val firstLesson: LessonId = LessonId("lesson-1")

internal val secondLesson: LessonId = LessonId("lesson-2")

internal val firstLessonName: LessonName = LessonName.Shelved(number = 1)

internal fun lessonOf(
    id: LessonId = firstLesson,
    requiredSchoolLevel: Int = 1,
    isStudied: Boolean = false,
    wordCount: Int = 5,
    duration: Duration = 150.seconds,
    readings: List<TownSnapshot.WordReading> = emptyList(),
    standings: List<WordStanding> = List(size = wordCount) { WordStanding.NotStarted },
    theme: String = "A day in town",
    ratePercent: Int = 5,
    resource: TownResourceKind = TownResourceKind.Food,
): TownSnapshot.Lesson = TownSnapshot.Lesson(
    id = id,
    theme = theme,
    duration = duration,
    requiredSchoolLevel = requiredSchoolLevel,
    skill = TownSnapshot.LessonSkill(resource, ratePercent),
    isStudied = isStudied,
    wordCount = wordCount,
    readings = readings,
    standings = standings,
)

internal fun slotOf(
    lesson: LessonId = firstLesson,
    startedAt: Instant = readInstant,
    lasting: Duration = 150.seconds,
): TownSnapshot.LessonSlot = TownSnapshot.LessonSlot(lesson, startedAt, startedAt + lasting)

internal fun workOf(finishesAt: Instant): TownSnapshot.WorkItem =
    TownSnapshot.WorkItem(TownBuildingKind.School, level = 2, startsAt = readInstant, finishesAt = finishesAt)

internal fun townOf(
    lessons: List<TownSnapshot.Lesson> = listOf(lessonOf()),
    skills: List<TownSnapshot.EarnedSkill> = emptyList(),
    learning: TownSnapshot.Learning = TownSnapshot.Learning(cap = 10, inLearning = 0, retainedWords = null),
    lessonSlot: TownSnapshot.LessonSlot? = null,
    workSlot: TownSnapshot.WorkItem? = null,
    schoolLevel: Int = 1,
    seasonInForce: SeasonInForce? = null,
    seasonEndsAt: Instant? = null,
    nextStep: NextStep = NextStep.CaughtUp(goal = null),
    nextDueAt: Instant? = null,
    readAt: Instant = readInstant,
    releasedLessons: List<TownSnapshot.ReleasedLesson> = emptyList(),
): TownSnapshot = TownSnapshot(
    name = "Riverton",
    label = TownLabel.Town,
    seasonInForce = seasonInForce,
    seasonEndsAt = seasonEndsAt,
    stocks = emptyList(),
    people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
    buildings = listOf(
        TownSnapshot.Building(TownBuildingKind.Homes, level = 7, next = null),
        TownSnapshot.Building(TownBuildingKind.School, level = schoolLevel, next = null),
    ),
    work = TownSnapshot.Work(slot = workSlot, waitingList = emptyList(), cap = 2),
    lessons = lessons,
    releasedLessons = releasedLessons,
    skills = skills,
    learning = learning,
    lessonSlot = lessonSlot,
    hiring = hiringOf(),
    job = null,
    nextStep = nextStep,
    tip = null,
    nextDueAt = nextDueAt,
    readAt = readAt,
)

internal val caughtUpCard: NextStepCard = townOf().nextStepCard()

internal fun contentOf(viewModel: SchoolViewModel): SchoolUiState.Content =
    viewModel.state.value as SchoolUiState.Content

internal fun TestScope.schoolViewModelOf(towns: FakeTownRepository, start: Instant = readInstant): SchoolViewModel {
    val viewModel: SchoolViewModel = SchoolViewModel(towns, TestClock(testScheduler, start))
    backgroundScope.launch(start = CoroutineStart.UNDISPATCHED) {
        try {
            awaitCancellation()
        } finally {
            viewModel.viewModelScope.cancel()
        }
    }
    return viewModel
}

internal fun TestScope.schoolReadingFrom(towns: FakeTownRepository, town: TownSnapshot): SchoolViewModel {
    towns.answerRead(TownReadResult.Read(town))
    val viewModel: SchoolViewModel = schoolViewModelOf(towns)
    runCurrent()
    return viewModel
}

internal fun releasedLessonOf(
    id: LessonId,
    position: Int,
    band: PlacementBand = PlacementBand.Second,
    isStudied: Boolean = false,
    wordCount: Int = 5,
    readings: List<TownSnapshot.WordReading> = emptyList(),
    standings: List<WordStanding> = List(size = wordCount) { WordStanding.NotStarted },
): TownSnapshot.ReleasedLesson = TownSnapshot.ReleasedLesson(
    id = id,
    band = band,
    position = position,
    duration = 150.seconds,
    requiredSchoolLevel = 1,
    isStudied = isStudied,
    wordCount = wordCount,
    readings = readings,
    standings = standings,
)
