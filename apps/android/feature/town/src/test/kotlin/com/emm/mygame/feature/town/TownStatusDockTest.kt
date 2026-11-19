package com.emm.mygame.feature.town

import com.emm.mygame.core.network.CaughtUpReason
import com.emm.mygame.core.network.NextStep
import com.emm.mygame.core.network.NextStepCard
import com.emm.mygame.core.network.TownBuildingKind
import com.emm.mygame.core.network.TownGoal
import com.emm.mygame.core.network.TownSnapshot
import kotlin.time.Duration
import org.junit.Assert.assertEquals
import org.junit.Test

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
        val fullCap: TownSnapshot = townOf(nextStep = NextStep.CaughtUp(CaughtUpReason.LearningCap, schoolGoal)).copy(
            learning = TownSnapshot.Learning(cap = 15, inLearning = 15, retainedWords = null),
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
}
