package com.emm.mygame.feature.town.status

import com.emm.mygame.core.model.town.TownSnapshot
import com.emm.mygame.core.model.town.building.TownBuildingKind
import com.emm.mygame.core.model.town.guidance.CaughtUpReason
import com.emm.mygame.core.model.town.guidance.NextStep
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.core.model.town.guidance.TownGoal
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.readInstant
import com.emm.mygame.feature.town.townOf
import org.junit.Assert.assertEquals
import org.junit.Test
import kotlin.time.Duration
import kotlin.time.Duration.Companion.hours
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

class TownStatusDockTest {

    private val schoolGoal: TownGoal = TownGoal(
        position = 1,
        count = 3,
        building = TownBuildingKind.School,
        level = 2,
        state = TownGoal.State.Underway,
    )

    @Test
    fun `a full learning cap keeps the goal beside the cap's line`() {
        val learningCap: NextStep = NextStep.CaughtUp(CaughtUpReason.LearningCap, schoolGoal, text = null)
        val fullCap: TownSnapshot = townOf(nextStep = learningCap).copy(
            learning = TownSnapshot.Learning(
                cap = 15,
                inLearning = 15,
                retainedWords = null,
                nextInLearningDueAt = null,
            ),
        )

        val step: TownStatusUiState.Dock.Step = fullCap.dockOn(
            screen = TownStatusScreen.ReadsTown,
            now = readInstant,
            gap = Duration.ZERO,
            lessonStart = TownUiState.LessonStartStatus.Idle,
        )

        assertEquals(
            NextStepCard.Line.LearningCap(inLearning = 15, cap = 15) to TownStatusUiState.StepDetail.Goal(schoolGoal),
            step.line to step.detail,
        )
    }

    private fun fullCapWith(nextStep: NextStep, nextInLearningDueAt: Instant): TownSnapshot =
        townOf(nextStep = nextStep).copy(
            learning = TownSnapshot.Learning(
                cap = 15,
                inLearning = 15,
                retainedWords = null,
                nextInLearningDueAt = nextInLearningDueAt,
            ),
        )

    private fun TownSnapshot.stepAt(gap: Duration): TownStatusUiState.Dock.Step = dockOn(
        screen = TownStatusScreen.ReadsTown,
        now = readInstant,
        gap = gap,
        lessonStart = TownUiState.LessonStartStatus.Idle,
    )

    @Test
    fun `a full cap with no review due waits for the next word in learning on the device clock`() {
        val town: TownSnapshot = fullCapWith(
            NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null, text = null),
            nextInLearningDueAt = readInstant + 3.hours,
        )

        assertEquals(
            TownStatusUiState.CapWait(remaining = 3.hours, dueAt = readInstant + 3.hours - 5.minutes),
            town.stepAt(gap = 5.minutes).capWait,
        )
    }

    @Test
    fun `a full cap with a review due waits for no word in learning`() {
        val town: TownSnapshot = fullCapWith(
            NextStep.Reviews(count = 3, readFirst = emptyList()),
            nextInLearningDueAt = readInstant + 3.hours,
        )

        assertEquals(null, town.stepAt(gap = Duration.ZERO).capWait)
    }

    @Test
    fun `a full cap whose next word in learning is overdue waits for no word in learning`() {
        val town: TownSnapshot = fullCapWith(
            NextStep.CaughtUp(CaughtUpReason.LearningCap, goal = null, text = null),
            nextInLearningDueAt = readInstant - 3.hours,
        )

        assertEquals(null, town.stepAt(gap = Duration.ZERO).capWait)
    }
}
