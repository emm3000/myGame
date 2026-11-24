package com.emm.mygame.feature.town.status

import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.getBoundsInRoot
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasAnyDescendant
import androidx.compose.ui.test.hasClickAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeContentTestRule
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onFirst
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.emm.mygame.core.designsystem.MyGameTheme
import com.emm.mygame.core.designsystem.MyGameTransitions
import com.emm.mygame.core.designsystem.NAV_ROW_CHEVRON
import com.emm.mygame.core.designsystem.SKELETON_BLOCK
import com.emm.mygame.core.model.town.SeasonKind
import com.emm.mygame.core.model.town.TownRegistered
import com.emm.mygame.core.model.town.guidance.NextStepCard
import com.emm.mygame.feature.town.TownMutations
import com.emm.mygame.feature.town.TownScreen
import com.emm.mygame.feature.town.TownUiState
import com.emm.mygame.feature.town.contentAt
import com.emm.mygame.feature.town.guidance.ClosedGuidance
import com.emm.mygame.feature.town.readInstant
import com.emm.mygame.feature.town.seasonOf
import com.emm.mygame.feature.town.townOf
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.Duration
import kotlin.time.Duration.Companion.days

@RunWith(RobolectricTestRunner::class)
class TownReportRowTest {

    @get:Rule
    val composeRule: ComposeContentTestRule = createComposeRule()

    private val homeInSummer: TownUiState.Content = townOf(
        seasonInForce = seasonOf(SeasonKind.Summer),
        seasonEndsAt = readInstant + 3.days,
    ).contentAt(
        now = readInstant,
        gap = Duration.ZERO,
        mutations = TownMutations.none,
        registered = TownRegistered.nothing,
        hireEntries = emptyMap(),
        closed = ClosedGuidance.none,
    )

    private val reviewsStep: TownStatusUiState.Dock = stepGoing(NextStepCard.Action.StartReviews)

    private val reportStep: TownStatusUiState.Dock = stepGoing(NextStepCard.Action.GoToReport)

    private val blockedReportStep: TownStatusUiState.Dock = stepGoing(NextStepCard.Action.GoToReport).copy(
        go = TownStatusUiState.Go.Blocked(NextStepCard.Action.GoToReport, TownStatusUiState.GoBlock.NoReviewsDue),
    )

    private val chevronOfTheRow: SemanticsMatcher = hasTestTag(NAV_ROW_CHEVRON)
        .and(hasAnyAncestor(hasClickAction().and(hasAnyDescendant(hasText(REPORT)))))

    private var reportOpens: Int = 0

    @Test
    fun `draws the Report as a nav row`() {
        show(state = homeInSummer, dock = reviewsStep)

        composeRule.onAllNodes(chevronOfTheRow, useUnmergedTree = true).assertCountEquals(1)
        composeRule.onNodeWithText(REPORT).performClick()
        assertEquals(1, reportOpens)
    }

    @Test
    fun `draws the Report row under the season line`() {
        show(state = homeInSummer, dock = reviewsStep)

        val season: Float = composeRule.onNodeWithText(SEASON, substring = true).getBoundsInRoot().bottom.value
        val row: Float = composeRule.onNodeWithText(REPORT).getBoundsInRoot().top.value

        assertTrue("the row at $row is under the season line at $season", row >= season)
    }

    @Test
    fun `draws the Report row above the skeleton while the page header is not drawn`() {
        show(state = TownUiState.Loading, dock = reviewsStep)
        composeRule.mainClock.advanceTimeBy(MyGameTransitions.REVEAL_MILLIS + REVEAL_MARGIN_MILLIS)
        composeRule.waitForIdle()

        val row: Float = composeRule.onNodeWithText(REPORT).getBoundsInRoot().bottom.value
        val skeleton: Float = composeRule.onAllNodesWithTag(SKELETON_BLOCK, useUnmergedTree = true)
            .onFirst()
            .getBoundsInRoot()
            .top
            .value

        assertTrue("the row ending at $row is above the skeleton at $skeleton", row <= skeleton)
    }

    @Test
    fun `draws no Report row when the go is the way to the Report`() {
        show(state = homeInSummer, dock = reportStep)

        composeRule.onAllNodes(hasText(REPORT)).assertCountEquals(0)
    }

    @Test
    fun `draws no Report row when the blocked go is the way to the Report`() {
        show(state = homeInSummer, dock = blockedReportStep)

        composeRule.onAllNodes(hasText(REPORT)).assertCountEquals(0)
    }

    private fun show(state: TownUiState, dock: TownStatusUiState.Dock) {
        composeRule.setContent {
            MyGameTheme {
                TownScreen(
                    state = state,
                    onIntent = {},
                    onSchoolOpen = {},
                    onMapOpen = {},
                    onTextOpen = {},
                    reportRow = { TownReportRow(dock = dock, onClick = { reportOpens += 1 }) },
                )
            }
        }
        composeRule.waitForIdle()
    }

    private fun stepGoing(action: NextStepCard.Action): TownStatusUiState.Dock.Step = TownStatusUiState.Dock.Step(
        line = NextStepCard.Line.NoReviewsDue,
        detail = null,
        countdown = null,
        go = TownStatusUiState.Go.Acts(action, isBusy = false),
        lessonStart = TownUiState.LessonStartStatus.Idle,
        capWait = null,
    )

    private companion object {
        const val REPORT: String = "Informe"
        const val SEASON: String = "año 1"
        const val REVEAL_MARGIN_MILLIS: Long = 50
    }
}
