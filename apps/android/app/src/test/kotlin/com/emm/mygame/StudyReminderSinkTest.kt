package com.emm.mygame

import android.content.Context
import android.content.SharedPreferences
import com.emm.mygame.core.model.holdout.HoldoutCheck
import com.emm.mygame.core.model.holdout.HoldoutCheckWeek
import com.emm.mygame.core.model.learning.DueReview
import com.emm.mygame.core.model.learning.DueReviews
import com.emm.mygame.core.model.learning.LessonId
import com.emm.mygame.core.model.learning.WordId
import com.emm.mygame.core.model.placement.PlacementBand
import com.emm.mygame.core.model.reminder.StudyReminderChoice
import com.emm.mygame.core.model.report.TownReport
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.TownAnswerFreshness
import com.emm.mygame.core.network.TownSnapshot
import com.emm.mygame.core.projection.StudyReminderFacts
import com.emm.mygame.core.testing.FakeTownRepository
import com.emm.mygame.core.testing.lessonsDone
import com.emm.mygame.core.testing.townOf
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import java.time.LocalTime
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class StudyReminderSinkTest {

    private val towns: FakeTownRepository = FakeTownRepository()

    private val preferences: SharedPreferences = preferencesFile()

    private val store: StudyReminderStore = StudyReminderStore(preferences, onChange = { _, _ -> })

    private val readAt: Instant = Instant.parse("2026-11-17T09:00:00Z")

    private val nextDueAt: Instant = Instant.parse("2026-11-19T09:00:00Z")

    private val lessonFinishesAt: Instant = Instant.parse("2026-11-17T09:05:00Z")

    private val runningLesson: TownSnapshot.LessonSlot =
        TownSnapshot.LessonSlot(LessonId("lesson-1"), startedAt = readAt, finishesAt = lessonFinishesAt)

    private val fresh: TownAnswerFreshness = TownAnswerFreshness(areCardsFresh = true, isCheckFresh = true)

    private val reminderOn: StudyReminderChoice = StudyReminderChoice(isOn = true, time = LocalTime.of(19, 0))

    @Test
    fun `a town answer stores the facts`() = runTest {
        val town: TownSnapshot = answeredTown(
            nextStep = NextStep.LessonToStudy(LessonId("lesson-2")),
            dueHoldoutChecks = listOf(TownSnapshot.DueHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)),
            lessonSlot = runningLesson,
        )

        sink().townAnswered(town, fresh)

        val expected = StudyReminderFacts(
            cardsWaitingFrom = nextDueAt,
            lessonFinishingAt = lessonFinishesAt,
            isCheckDue = true,
            isLessonReady = true,
        )
        assertEquals(expected, store.facts.value)
    }

    @Test
    fun `a town answer newer than a reviews read decides the cards`() = runTest {
        val sink: StudyReminderSink = sink()
        sink.reviewsAnswered(DueReviews(emptyList(), readFirst = emptyList(), nextDueAt = nextDueAt, readAt = readAt))

        sink.townAnswered(answeredTown(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())), fresh)

        assertEquals(StudyReminderFacts(cardsWaitingFrom = readAt), store.facts.value)
    }

    @Test
    fun `a town answer older than a reviews read keeps that read's cards and its own lesson finish`() = runTest {
        val sink: StudyReminderSink = sink()
        sink.reviewsAnswered(DueReviews(emptyList(), readFirst = emptyList(), nextDueAt = nextDueAt, readAt = readAt))
        val olderTown: TownSnapshot = answeredTown(
            nextStep = NextStep.LessonToStudy(LessonId("lesson-2")),
            lessonSlot = runningLesson,
        ).copy(nextDueAt = null)

        sink.townAnswered(olderTown, TownAnswerFreshness(areCardsFresh = false, isCheckFresh = true))

        val expected = StudyReminderFacts(
            cardsWaitingFrom = nextDueAt,
            lessonFinishingAt = lessonFinishesAt,
            isLessonReady = true,
        )
        assertEquals(expected, store.facts.value)
    }

    @Test
    fun `a town answer older than a reviews read at its lesson's finish drops the finish`() = runTest {
        val sink: StudyReminderSink = sink()
        val readAtTheFinish =
            DueReviews(emptyList(), readFirst = emptyList(), nextDueAt = nextDueAt, readAt = lessonFinishesAt)
        sink.reviewsAnswered(readAtTheFinish)
        val olderTown: TownSnapshot = answeredTown(
            nextStep = NextStep.LessonToStudy(LessonId("lesson-2")),
            lessonSlot = runningLesson,
        ).copy(nextDueAt = null)

        sink.townAnswered(olderTown, TownAnswerFreshness(areCardsFresh = false, isCheckFresh = true))

        assertEquals(StudyReminderFacts(cardsWaitingFrom = nextDueAt, isLessonReady = true), store.facts.value)
    }

    @Test
    fun `asks nothing after a holdout checks answer holding a check`() = runTest {
        store.choose(reminderOn)

        sink().holdoutChecksAnswered(listOf(HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)))
        runCurrent()

        assertEquals(0, towns.readCount)
    }

    @Test
    fun `asks nothing after a Report with due cards`() = runTest {
        store.choose(reminderOn)

        sink().reportAnswered(reportOf(dueCount = 2, readAt = readAt))
        runCurrent()

        assertEquals(0, towns.readCount)
    }

    @Test
    fun `a town answer with a stale check keeps the stored check due`() = runTest {
        val sink: StudyReminderSink = sink()
        sink.holdoutChecksAnswered(emptyList())
        val olderTown: TownSnapshot = answeredTown(
            nextStep = NextStep.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth),
            dueHoldoutChecks = listOf(TownSnapshot.DueHoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)),
        )

        sink.townAnswered(olderTown, TownAnswerFreshness(areCardsFresh = true, isCheckFresh = false))

        assertEquals(StudyReminderFacts(cardsWaitingFrom = nextDueAt), store.facts.value)
    }

    @Test
    fun `a town on the reviews step waits from its read`() = runTest {
        sink().townAnswered(answeredTown(nextStep = NextStep.Reviews(count = 3, readFirst = emptyList())), fresh)

        assertEquals(StudyReminderFacts(cardsWaitingFrom = readAt), store.facts.value)
    }

    @Test
    fun `a town on the holdout check step holds check due`() = runTest {
        val checkStep = NextStep.HoldoutCheck(PlacementBand.First, HoldoutCheckWeek.Eighth)

        sink().townAnswered(answeredTown(nextStep = checkStep), fresh)

        assertEquals(StudyReminderFacts(cardsWaitingFrom = nextDueAt, isCheckDue = true), store.facts.value)
    }

    @Test
    fun `a released lesson step holds lesson ready`() = runTest {
        val releasedStep = NextStep.ReleasedLesson(LessonId("released-1-1"), PlacementBand.First, position = 1)

        sink().townAnswered(answeredTown(nextStep = releasedStep), fresh)

        assertEquals(StudyReminderFacts(cardsWaitingFrom = nextDueAt, isLessonReady = true), store.facts.value)
    }

    @Test
    fun `a reviews answer with a due card waits from its read`() = runTest {
        sink().reviewsAnswered(DueReviews(listOf(dueCard), readFirst = emptyList(), nextDueAt = null, readAt = readAt))

        assertEquals(StudyReminderFacts(cardsWaitingFrom = readAt), store.facts.value)
    }

    @Test
    fun `a Report answer with due cards waits from its read`() = runTest {
        val reportReadAt: Instant = Instant.parse("2026-11-17T09:00:42Z")

        sink().reportAnswered(reportOf(dueCount = 2, readAt = reportReadAt))

        assertEquals(StudyReminderFacts(cardsWaitingFrom = reportReadAt), store.facts.value)
    }

    @Test
    fun `a holdout checks answer holding a check sets check due`() = runTest {
        sink().holdoutChecksAnswered(listOf(HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)))

        assertEquals(StudyReminderFacts(isCheckDue = true), store.facts.value)
    }

    @Test
    fun `asks the town once after a reviews answer with nothing due while on`() = runTest {
        store.choose(reminderOn)

        sink().reviewsAnswered(DueReviews(emptyList(), readFirst = emptyList(), nextDueAt = nextDueAt, readAt = readAt))
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `asks the town once after a Report answer with nothing due while on`() = runTest {
        store.choose(reminderOn)

        sink().reportAnswered(reportOf(dueCount = 0, readAt = readAt))
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `asks the town once after a holdout checks answer with no check while on`() = runTest {
        store.choose(reminderOn)

        sink().holdoutChecksAnswered(emptyList())
        runCurrent()

        assertEquals(1, towns.readCount)
    }

    @Test
    fun `asks nothing while cards are due`() = runTest {
        store.choose(reminderOn)

        sink().reviewsAnswered(DueReviews(listOf(dueCard), readFirst = emptyList(), nextDueAt = null, readAt = readAt))
        runCurrent()

        assertEquals(0, towns.readCount)
    }

    @Test
    fun `asks nothing while off`() = runTest {
        val sink: StudyReminderSink = sink()

        sink.reviewsAnswered(DueReviews(emptyList(), readFirst = emptyList(), nextDueAt = nextDueAt, readAt = readAt))
        sink.reportAnswered(reportOf(dueCount = 0, readAt = readAt))
        sink.holdoutChecksAnswered(emptyList())
        runCurrent()

        assertEquals(0, towns.readCount)
    }

    @Test
    fun `a town answer never asks a read`() = runTest {
        store.choose(reminderOn)

        sink().townAnswered(answeredTown(nextStep = lessonsDone), fresh)
        runCurrent()

        assertEquals(0, towns.readCount)
    }

    @Test
    fun `a session change clears the switch, the time and the facts`() = runTest {
        store.choose(StudyReminderChoice(isOn = true, time = LocalTime.of(7, 30)))
        val sink: StudyReminderSink = sink()
        sink.holdoutChecksAnswered(listOf(HoldoutCheck.Due(PlacementBand.First, HoldoutCheckWeek.Eighth)))

        sink.sessionChanged()

        assertEquals(StudyReminderChoice.firstChoice to StudyReminderFacts(), store.choice.value to store.facts.value)
    }

    @Test
    fun `a new store over the same file reads nothing after a session change`() = runTest {
        store.choose(reminderOn)
        store.fold { facts: StudyReminderFacts -> facts.afterHoldoutChecksAnswer(holdsCheck = true) }
        val unopenedStore: Lazy<StudyReminderStore> = lazy {
            StudyReminderStore(preferencesFile(), onChange = { _, _ -> })
        }

        StudyReminderSink(store = unopenedStore, towns = { towns }, scope = backgroundScope).sessionChanged()

        val restarted: StudyReminderStore = StudyReminderStore(preferencesFile(), onChange = { _, _ -> })

        assertEquals(
            StudyReminderChoice.firstChoice to StudyReminderFacts(),
            restarted.choice.value to restarted.facts.value,
        )
    }

    private fun preferencesFile(): SharedPreferences =
        RuntimeEnvironment.getApplication().getSharedPreferences("study-reminder-test", Context.MODE_PRIVATE)

    private fun TestScope.sink(): StudyReminderSink =
        StudyReminderSink(store = lazyOf(store), towns = { towns }, scope = backgroundScope)

    private val dueCard: DueReview.Recall = DueReview.Recall(
        wordId = WordId("lesson-1-1"),
        lesson = LessonId("lesson-1"),
        dueAt = readAt,
        gloss = "hogar",
        gappedFrame = emptyList(),
    )

    private fun reportOf(dueCount: Int, readAt: Instant): TownReport = TownReport(
        dueCount = dueCount,
        readFirst = emptyList(),
        nextDueAt = nextDueAt,
        news = emptyList(),
        readAt = readAt,
    )

    private fun answeredTown(
        nextStep: NextStep,
        dueHoldoutChecks: List<TownSnapshot.DueHoldoutCheck> = emptyList(),
        lessonSlot: TownSnapshot.LessonSlot? = null,
    ): TownSnapshot = townOf(
        readAt,
        nextStep = nextStep,
        hasOffice = false,
        lessonSlot = lessonSlot,
        dueHoldoutChecks = dueHoldoutChecks,
        nextDueAt = nextDueAt,
    )
}
