package com.emm.mygame.feature.town

import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithText
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import com.emm.mygame.core.network.TownRegistered
import kotlin.time.Duration
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TownFoldedDockTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val readTown: TownUiState.Content = townOf().contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        mutations = TownMutations.none,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )

    @Test
    fun `keeps the folded dock drawn while the skeleton holds after the town is read`() {
        val shown: MutableState<TownUiState> = mutableStateOf(TownUiState.Loading)
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = shown.value,
                    onIntent = {},
                    onSchoolOpen = {},
                    onMapOpen = {},
                    foldedDock = { BasicText(FOLDED_LINE) },
                )
            }
        }
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)

        shown.value = readTown
        composeRule.mainClock.advanceTimeByFrame()
        composeRule.mainClock.advanceTimeByFrame()

        composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true).assertCountEquals(SKELETON_BLOCKS)
        composeRule.onNodeWithText(FOLDED_LINE).assertExists()
    }

    private companion object {
        const val FOLDED_LINE: String = "Folded line"
        const val REVEAL_MARGIN_MILLIS: Long = 50
        const val SKELETON_BLOCKS: Int = 5
    }
}
