package com.emm.mygame.feature.fief

import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.assertIsNotFocused
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performImeAction
import androidx.compose.ui.test.requestFocus
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.UnitKind
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runner.RunWith
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration.Companion.minutes
import kotlin.time.Instant

@RunWith(RobolectricTestRunner::class)
class ArmySectionFocusTest {

    @get:Rule(order = 0)
    val touchMode: TestRule = TestRule { base: Statement, _: Description ->
        InstrumentationRegistry.getInstrumentation().setInTouchMode(true)
        base
    }

    @get:Rule(order = 1)
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `a cancelled levy leaves no field focused`() {
        val army: MutableState<FiefUiState.ArmyLine> = mutableStateOf(runningLevy())
        draw(army) { intent: FiefIntent ->
            if (intent is FiefIntent.RecruitCancelTapped) army.value = idleBarracks()
        }
        recruitField().requestFocus()

        composeRule.onNodeWithContentDescription("Cancelar la leva", substring = true).performClick()

        recruitField().assertIsNotFocused()
    }

    @Test
    fun `a levy sent by the button leaves no field focused`() {
        val army: MutableState<FiefUiState.ArmyLine> = mutableStateOf(idleBarracks())
        draw(army) {}
        recruitField().requestFocus()

        composeRule.onNodeWithText("Reclutar infantes").performClick()

        recruitField().assertIsNotFocused()
    }

    @Test
    fun `a levy sent by the keyboard leaves no field focused`() {
        val army: MutableState<FiefUiState.ArmyLine> = mutableStateOf(idleBarracks())
        draw(army) {}
        recruitField().requestFocus()

        recruitField().performImeAction()

        recruitField().assertIsNotFocused()
    }

    private fun recruitField(): SemanticsNodeInteraction =
        composeRule.onNodeWithContentDescription("Infantes a reclutar")

    private fun draw(army: MutableState<FiefUiState.ArmyLine>, onIntent: (FiefIntent) -> Unit) {
        composeRule.setContent {
            MyGameTheme {
                ArmySection(army = army.value, onIntent = onIntent)
            }
        }
    }

    private fun idleBarracks(): FiefUiState.ArmyLine = barracks(
        slot = FiefUiState.LevySlotLine.Idle,
        infantry = infantryCard(isEntryLocked = false, block = null),
    )

    private fun runningLevy(): FiefUiState.ArmyLine = barracks(
        slot = FiefUiState.LevySlotLine.Busy(
            unit = UnitKind.Infantry,
            count = 12,
            delivered = 4,
            remaining = 30.minutes,
            startedAt = Instant.parse("2026-11-03T10:00:00Z"),
            refund = emptyList(),
        ),
        infantry = infantryCard(isEntryLocked = true, block = FiefUiState.RecruitBlock.LevyRunning),
    )

    private fun infantryCard(isEntryLocked: Boolean, block: FiefUiState.RecruitBlock?): FiefUiState.UnitCard.Open =
        FiefUiState.UnitCard.Open(
            kind = UnitKind.Infantry,
            atHome = 12,
            away = 0,
            entry = "1",
            isEntryLocked = isEntryLocked,
            order = null,
            block = block,
        )

    private fun barracks(slot: FiefUiState.LevySlotLine, infantry: FiefUiState.UnitCard.Open): FiefUiState.ArmyLine =
        FiefUiState.ArmyLine(
            slot = slot,
            march = FiefUiState.MarchSlotLine.Idle,
            units = listOf(infantry),
            recruit = FiefUiState.RecruitStatus.Idle,
            recall = FiefUiState.RecallStatus.Idle,
        )
}
