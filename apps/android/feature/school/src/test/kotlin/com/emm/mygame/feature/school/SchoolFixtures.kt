package com.emm.mygame.feature.school

import androidx.lifecycle.viewModelScope
import com.emm.mygame.core.network.LessonId
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownLabel
import com.emm.mygame.core.network.TownReadResult
import com.emm.mygame.core.network.TownResourceKind
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.TestClock
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

internal fun lessonOf(
    id: LessonId = firstLesson,
    requiredSchoolLevel: Int = 1,
    isStudied: Boolean = false,
    wordCount: Int = 5,
    duration: Duration = 150.seconds,
    readings: List<TownSnapshot.WordReading> = emptyList(),
): TownSnapshot.Lesson = TownSnapshot.Lesson(
    id = id,
    theme = "A day in town",
    duration = duration,
    requiredSchoolLevel = requiredSchoolLevel,
    skill = TownSnapshot.LessonSkill(TownResourceKind.Food, ratePercent = 5),
    isStudied = isStudied,
    wordCount = wordCount,
    readings = readings,
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
    learning: TownSnapshot.Learning = TownSnapshot.Learning(cap = 10, inLearning = 0),
    lessonSlot: TownSnapshot.LessonSlot? = null,
    workSlot: TownSnapshot.WorkItem? = null,
    schoolLevel: Int = 1,
    seasonEndsAt: Instant? = null,
    readAt: Instant = readInstant,
): TownSnapshot = TownSnapshot(
    name = "Riverton",
    label = TownLabel.Town,
    seasonEndsAt = seasonEndsAt,
    stocks = emptyList(),
    people = TownSnapshot.People(supplied = 10, free = 4, atWork = 6),
    buildings = listOf(
        TownSnapshot.Building(TownBuildingKind.Homes, level = 7, next = null),
        TownSnapshot.Building(TownBuildingKind.School, level = schoolLevel, next = null),
    ),
    work = TownSnapshot.Work(slot = workSlot, waitingList = emptyList(), cap = 2),
    lessons = lessons,
    skills = skills,
    learning = learning,
    lessonSlot = lessonSlot,
    readAt = readAt,
)

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
