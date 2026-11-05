package com.emm.mygame.feature.fief

import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.network.RecruitRefusal
import com.emm.mygame.core.network.UnitKind
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ArmySectionRefusalTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    @Test
    fun `a barracks too low reads the unit and the level the api names`() {
        val refused: FiefUiState.RecruitStatus =
            FiefUiState.RecruitStatus.Refused(RecruitRefusal.BarracksTooLow(UnitKind.Archer, 4))

        composeRule.setContent {
            MyGameTheme {
                ArmySection(army = barracksWith(refused), onIntent = {})
            }
        }

        composeRule
            .onNodeWithText("Tu cuartel aún no llega al nivel 4 que piden los arqueros. Mejóralo primero.")
            .assertExists()
    }

    private fun barracksWith(recruit: FiefUiState.RecruitStatus): FiefUiState.ArmyLine = FiefUiState.ArmyLine(
        slot = FiefUiState.LevySlotLine.Idle,
        march = FiefUiState.MarchSlotLine.Idle,
        units = listOf(
            FiefUiState.UnitCard.Open(
                kind = UnitKind.Infantry,
                atHome = 12,
                away = 0,
                entry = "1",
                isEntryLocked = false,
                order = null,
                block = null,
            ),
        ),
        recruit = recruit,
        recall = FiefUiState.RecallStatus.Idle,
    )
}
